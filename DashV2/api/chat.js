export const config = { runtime: 'edge' }

// Detect provider from key prefix
function detectProvider(key) {
  if (key.startsWith('sk-ant-')) return 'anthropic'
  if (key.startsWith('sk-'))     return 'openai'
  if (key.startsWith('AIza'))    return 'gemini'
  return null
}

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  let body
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 })
  }

  const { key, system, messages } = body

  if (!key) {
    return new Response(JSON.stringify({ error: 'No API key provided' }), { status: 400 })
  }

  const provider = detectProvider(key)
  if (!provider) {
    return new Response(
      JSON.stringify({ error: 'Unrecognized key format. Supported: OpenAI (sk-…), Anthropic (sk-ant-…), Gemini (AIza…)' }),
      { status: 400 }
    )
  }

  // Call the upstream provider
  let upstream
  try {
    if (provider === 'openai')     upstream = await callOpenAI(key, system, messages)
    if (provider === 'anthropic')  upstream = await callAnthropic(key, system, messages)
    if (provider === 'gemini')     upstream = await callGemini(key, system, messages)
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 502 })
  }

  if (!upstream.ok) {
    const text = await upstream.text()
    return new Response(text, { status: upstream.status })
  }

  // Proxy + normalize the SSE stream to { text } chunks
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const reader = upstream.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() ?? ''

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            const data = line.slice(6).trim()
            if (data === '[DONE]') continue

            let text = ''
            try {
              const json = JSON.parse(data)
              if (provider === 'openai') {
                text = json.choices?.[0]?.delta?.content ?? ''
              } else if (provider === 'anthropic') {
                if (json.type === 'content_block_delta' && json.delta?.type === 'text_delta') {
                  text = json.delta.text ?? ''
                }
              } else if (provider === 'gemini') {
                text = json.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
              }
            } catch { /* skip malformed chunks */ }

            if (text) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`))
            }
          }
        }
      } catch (e) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: e.message })}\n\n`))
      }

      controller.enqueue(encoder.encode('data: [DONE]\n\n'))
      controller.close()
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
    },
  })
}

function callOpenAI(key, system, messages) {
  return fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'system', content: system }, ...messages],
      stream: true,
    }),
  })
}

function callAnthropic(key, system, messages) {
  return fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system,
      messages,
      stream: true,
    }),
  })
}

function callGemini(key, system, messages) {
  const contents = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }))

  return fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?alt=sse&key=${key}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        ...(system && { systemInstruction: { parts: [{ text: system }] } }),
        generationConfig: { maxOutputTokens: 2048 },
      }),
    }
  )
}
