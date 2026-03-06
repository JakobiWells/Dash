import { useState, useEffect } from 'react'

const STORAGE_KEY = 'dash-citations-v1'

function loadSaved() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') } catch { return [] }
}
function persistSaved(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}

const API_BASE = 'https://dash-production-3e07.up.railway.app'

const STYLES = ['APA', 'MLA', 'Chicago', 'IEEE', 'Harvard']
const SOURCES = ['Website', 'Book', 'Journal', 'YouTube']

const FIELDS = {
  Website: [
    { key: 'author', label: 'Author', placeholder: 'Last, First', half: false },
    { key: 'title', label: 'Page Title', placeholder: 'How to cite sources', half: false },
    { key: 'site', label: 'Website Name', placeholder: 'Purdue OWL', half: false },
    { key: 'url', label: 'URL', placeholder: 'https://...', half: false },
    { key: 'year', label: 'Year', placeholder: '2024', half: true },
    { key: 'month', label: 'Month', placeholder: 'January', half: true },
    { key: 'day', label: 'Day', placeholder: '15', half: true },
  ],
  Book: [
    { key: 'author', label: 'Author', placeholder: 'Last, First', half: false },
    { key: 'title', label: 'Book Title', placeholder: 'The Great Book', half: false },
    { key: 'publisher', label: 'Publisher', placeholder: 'Penguin Books', half: false },
    { key: 'place', label: 'City', placeholder: 'New York', half: true },
    { key: 'year', label: 'Year', placeholder: '2024', half: true },
    { key: 'edition', label: 'Edition', placeholder: '3rd', half: true },
  ],
  Journal: [
    { key: 'author', label: 'Author', placeholder: 'Last, First', half: false },
    { key: 'title', label: 'Article Title', placeholder: 'A study of...', half: false },
    { key: 'journal', label: 'Journal Name', placeholder: 'Nature', half: false },
    { key: 'year', label: 'Year', placeholder: '2024', half: true },
    { key: 'volume', label: 'Volume', placeholder: '12', half: true },
    { key: 'issue', label: 'Issue', placeholder: '3', half: true },
    { key: 'pages', label: 'Pages', placeholder: '45–67', half: true },
    { key: 'doi', label: 'DOI', placeholder: '10.1000/xyz123', half: false },
  ],
  YouTube: [
    { key: 'author', label: 'Channel / Uploader', placeholder: 'TED', half: false },
    { key: 'title', label: 'Video Title', placeholder: 'How to...', half: false },
    { key: 'url', label: 'URL', placeholder: 'https://youtube.com/watch?v=...', half: false },
    { key: 'year', label: 'Year', placeholder: '2024', half: true },
    { key: 'month', label: 'Month', placeholder: 'January', half: true },
    { key: 'day', label: 'Day', placeholder: '15', half: true },
  ],
}

// ── Helpers ───────────────────────────────────────────────────────────────────

// "Last, First Middle" → "F. M. Last" for IEEE
function toIEEEAuthor(author) {
  if (!author) return ''
  const [last, first = ''] = author.split(',').map(s => s.trim())
  if (!first) return last
  const initials = first.split(/\s+/).map(n => n[0] ? `${n[0]}.` : '').join(' ')
  return `${initials} ${last}`
}

// "Last, First" → "Last, F." for Harvard
function toHarvardAuthor(author) {
  if (!author) return ''
  const [last, first = ''] = author.split(',').map(s => s.trim())
  if (!first) return last
  const initials = first.split(/\s+/).map(n => n[0] ? `${n[0]}.` : '').join(' ')
  return `${last}, ${initials}`
}

// Short month abbreviation for IEEE (Jan., Feb., Mar. …)
const SHORT_MONTHS = {
  January: 'Jan.', February: 'Feb.', March: 'Mar.', April: 'Apr.',
  May: 'May', June: 'Jun.', July: 'Jul.', August: 'Aug.',
  September: 'Sep.', October: 'Oct.', November: 'Nov.', December: 'Dec.',
}

function shortMonth(m) { return SHORT_MONTHS[m] || m }

function accessedToday() {
  return new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

// ── Citation generators ────────────────────────────────────────────────────────
function generate(style, source, f) {
  const yr = f.year || 'n.d.'

  // ── APA ──────────────────────────────────────────────────────────────────────
  if (style === 'APA') {
    if (source === 'Website') {
      const author = f.author ? `${f.author}. ` : ''
      const date = f.year ? `(${f.year}${f.month ? `, ${f.month}` : ''}${f.day ? ` ${f.day}` : ''}). ` : '(n.d.). '
      const title = f.title ? `${f.title}. ` : ''
      const site = f.site ? `*${f.site}*. ` : ''
      return `${author}${date}${title}${site}${f.url || ''}`
    }
    if (source === 'Book') {
      const author = f.author ? `${f.author}. ` : ''
      const edition = f.edition ? ` (${f.edition} ed.)` : ''
      const title = f.title ? `*${f.title}*${edition}. ` : ''
      return `${author}(${yr}). ${title}${f.publisher || ''}.`
    }
    if (source === 'Journal') {
      const author = f.author ? `${f.author}. ` : ''
      const title = f.title ? `${f.title}. ` : ''
      const journal = f.journal ? `*${f.journal}*` : ''
      const vol = f.volume ? `, *${f.volume}*` : ''
      const issue = f.issue ? `(${f.issue})` : ''
      const pages = f.pages ? `, ${f.pages}` : ''
      const doi = f.doi ? `. https://doi.org/${f.doi}` : ''
      return `${author}(${yr}). ${title}${journal}${vol}${issue}${pages}.${doi}`
    }
    if (source === 'YouTube') {
      const author = f.author ? `${f.author}. ` : ''
      const date = f.year ? `(${f.year}${f.month ? `, ${f.month}` : ''}${f.day ? ` ${f.day}` : ''}). ` : '(n.d.). '
      const title = f.title ? `*${f.title}* [Video]. ` : ''
      return `${author}${date}${title}YouTube. ${f.url || ''}`
    }
  }

  // ── MLA ──────────────────────────────────────────────────────────────────────
  if (style === 'MLA') {
    if (source === 'Website') {
      const author = f.author ? `${f.author}. ` : ''
      const title = f.title ? `"${f.title}." ` : ''
      const site = f.site ? `*${f.site}*, ` : ''
      const dateParts = [f.day, f.month, f.year].filter(Boolean).join(' ')
      const date = dateParts ? `${dateParts}, ` : ''
      return `${author}${title}${site}${date}${f.url ? f.url + '.' : ''}`
    }
    if (source === 'Book') {
      const author = f.author ? `${f.author}. ` : ''
      const title = f.title ? `*${f.title}*. ` : ''
      const edition = f.edition ? `${f.edition} ed., ` : ''
      return `${author}${title}${edition}${f.publisher ? f.publisher + ', ' : ''}${f.year ? f.year + '.' : ''}`
    }
    if (source === 'Journal') {
      const author = f.author ? `${f.author}. ` : ''
      const title = f.title ? `"${f.title}." ` : ''
      const journal = f.journal ? `*${f.journal}*, ` : ''
      const vol = f.volume ? `vol. ${f.volume}, ` : ''
      const issue = f.issue ? `no. ${f.issue}, ` : ''
      const year = f.year ? `${f.year}, ` : ''
      const pages = f.pages ? `pp. ${f.pages}.` : ''
      return `${author}${title}${journal}${vol}${issue}${year}${pages}`
    }
    if (source === 'YouTube') {
      const title = f.title ? `"${f.title}." ` : ''
      const uploader = f.author ? `uploaded by ${f.author}, ` : ''
      const dateParts = [f.day, f.month, f.year].filter(Boolean).join(' ')
      const date = dateParts ? `${dateParts}, ` : ''
      return `${title}*YouTube*, ${uploader}${date}${f.url ? f.url + '.' : ''}`
    }
  }

  // ── Chicago ───────────────────────────────────────────────────────────────────
  if (style === 'Chicago') {
    if (source === 'Website') {
      const author = f.author ? `${f.author}. ` : ''
      const title = f.title ? `"${f.title}." ` : ''
      const site = f.site ? `*${f.site}*. ` : ''
      const date = f.month && f.day && f.year ? `${f.month} ${f.day}, ${f.year}. ` : f.year ? `${f.year}. ` : ''
      return `${author}${title}${site}${date}${f.url ? f.url + '.' : ''}`
    }
    if (source === 'Book') {
      const author = f.author ? `${f.author}. ` : ''
      const title = f.title ? `*${f.title}*. ` : ''
      const place = f.place ? `${f.place}: ` : ''
      return `${author}${title}${place}${f.publisher ? f.publisher + ', ' : ''}${f.year ? f.year + '.' : ''}`
    }
    if (source === 'Journal') {
      const author = f.author ? `${f.author}. ` : ''
      const title = f.title ? `"${f.title}." ` : ''
      const journal = f.journal ? `*${f.journal}* ` : ''
      const vol = f.volume || ''
      const issue = f.issue ? `, no. ${f.issue}` : ''
      const year = f.year ? ` (${f.year})` : ''
      const pages = f.pages ? `: ${f.pages}` : ''
      const doi = f.doi ? `. https://doi.org/${f.doi}` : ''
      return `${author}${title}${journal}${vol}${issue}${year}${pages}.${doi}`
    }
    if (source === 'YouTube') {
      const author = f.author ? `${f.author}. ` : ''
      const title = f.title ? `"${f.title}." ` : ''
      const date = f.month && f.day && f.year ? `${f.month} ${f.day}, ${f.year}. ` : f.year ? `${f.year}. ` : ''
      return `${author}${title}YouTube video. ${date}${f.url ? f.url + '.' : ''}`
    }
  }

  // ── IEEE ──────────────────────────────────────────────────────────────────────
  if (style === 'IEEE') {
    if (source === 'Website') {
      const author = f.author ? `${toIEEEAuthor(f.author)}, ` : ''
      const title = f.title ? `"${f.title}," ` : ''
      const site = f.site ? `*${f.site}*` : ''
      const mo = f.month ? shortMonth(f.month) : ''
      const date = mo && f.day && f.year ? `, ${mo} ${f.day}, ${f.year}` : f.year ? `, ${f.year}` : ''
      const url = f.url ? `. [Online]. Available: ${f.url}` : ''
      return `[1] ${author}${title}${site}${date}${url}`
    }
    if (source === 'Book') {
      const author = f.author ? `${toIEEEAuthor(f.author)}, ` : ''
      const title = f.title ? `*${f.title}*` : ''
      const edition = f.edition ? `, ${f.edition} ed.` : ''
      const place = f.place ? ` ${f.place}:` : ''
      const publisher = f.publisher ? ` ${f.publisher},` : ''
      const year = f.year ? ` ${f.year}` : ''
      return `[1] ${author}${title}${edition}.${place}${publisher}${year}.`
    }
    if (source === 'Journal') {
      const author = f.author ? `${toIEEEAuthor(f.author)}, ` : ''
      const title = f.title ? `"${f.title}," ` : ''
      const journal = f.journal ? `*${f.journal}*` : ''
      const vol = f.volume ? `, vol. ${f.volume}` : ''
      const issue = f.issue ? `, no. ${f.issue}` : ''
      const pages = f.pages ? `, pp. ${f.pages}` : ''
      const year = f.year ? `, ${f.year}` : ''
      const doi = f.doi ? `, doi: ${f.doi}` : ''
      return `[1] ${author}${title}${journal}${vol}${issue}${pages}${year}${doi}.`
    }
    if (source === 'YouTube') {
      const author = f.author ? `${toIEEEAuthor(f.author)}, ` : ''
      const title = f.title ? `"${f.title}," ` : ''
      const mo = f.month ? shortMonth(f.month) : ''
      const date = mo && f.day && f.year ? `${mo} ${f.day}, ${f.year}` : f.year || ''
      const url = f.url ? `. [Online]. Available: ${f.url}` : ''
      return `[1] ${author}${title}*YouTube*${date ? ', ' + date : ''}${url}`
    }
  }

  // ── Harvard ───────────────────────────────────────────────────────────────────
  if (style === 'Harvard') {
    if (source === 'Website') {
      const author = f.author ? `${toHarvardAuthor(f.author)} ` : ''
      const year = f.year ? `(${f.year}) ` : ''
      const title = f.title ? `'${f.title}', ` : ''
      const site = f.site ? `*${f.site}*, ` : ''
      const dateParts = [f.day, f.month].filter(Boolean).join(' ')
      const date = dateParts ? `${dateParts}. ` : ''
      const url = f.url ? `Available at: ${f.url} ` : ''
      return `${author}${year}${title}${site}${date}${url}(Accessed: ${accessedToday()}).`
    }
    if (source === 'Book') {
      const author = f.author ? `${toHarvardAuthor(f.author)} ` : ''
      const year = f.year ? `(${f.year}) ` : ''
      const title = f.title ? `*${f.title}*. ` : ''
      const edition = f.edition ? `${f.edition} edn. ` : ''
      const place = f.place ? `${f.place}: ` : ''
      const publisher = f.publisher ? `${f.publisher}.` : ''
      return `${author}${year}${title}${edition}${place}${publisher}`
    }
    if (source === 'Journal') {
      const author = f.author ? `${toHarvardAuthor(f.author)} ` : ''
      const year = f.year ? `(${f.year}) ` : ''
      const title = f.title ? `'${f.title}', ` : ''
      const journal = f.journal ? `*${f.journal}*, ` : ''
      const vol = f.volume ? `${f.volume}` : ''
      const issue = f.issue ? `(${f.issue}), ` : vol ? ', ' : ''
      const pages = f.pages ? `pp. ${f.pages}` : ''
      const doi = f.doi ? `. doi: ${f.doi}` : ''
      return `${author}${year}${title}${journal}${vol}${issue}${pages}${doi}.`
    }
    if (source === 'YouTube') {
      const author = f.author ? `${toHarvardAuthor(f.author)} ` : ''
      const year = f.year ? `(${f.year}) ` : ''
      const title = f.title ? `*${f.title}* [Video], ` : ''
      const dateParts = [f.day, f.month].filter(Boolean).join(' ')
      const date = dateParts ? `${dateParts}. ` : ''
      const url = f.url ? `Available at: ${f.url} ` : ''
      return `${author}${year}${title}${date}${url}(Accessed: ${accessedToday()}).`
    }
  }

  return ''
}

// ── URL/ISBN detection & fetching ─────────────────────────────────────────────
function detectSourceFromUrl(input) {
  if (/youtube\.com|youtu\.be/.test(input)) return 'YouTube'
  if (/doi\.org\/|^10\.\d{4,}\//.test(input)) return 'Journal'
  return 'Website'
}

function isISBN(input) {
  const clean = input.replace(/[-\s]/g, '')
  return /^\d{10}$/.test(clean) || /^\d{13}$/.test(clean) || /^97[89]\d{10}$/.test(clean)
}

async function fetchYouTubeMeta(url) {
  const res = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`)
  if (!res.ok) throw new Error('Could not fetch YouTube metadata')
  const data = await res.json()
  return { title: data.title || '', author: data.author_name || '', url, year: '', month: '', day: '' }
}

async function fetchDoiMeta(url) {
  const doi = url.replace(/https?:\/\/doi\.org\//, '')
  const res = await fetch(`https://api.crossref.org/works/${encodeURIComponent(doi)}`)
  if (!res.ok) throw new Error('Could not fetch DOI metadata')
  const { message: msg } = await res.json()
  const authorList = (msg.author || [])
    .map(a => `${a.family || ''}, ${a.given || ''}`.trim().replace(/,\s*$/, ''))
    .join('; ')
  const issued = msg.issued?.['date-parts']?.[0] || []
  return {
    author: authorList,
    title: (msg.title || [])[0] || '',
    journal: (msg['container-title'] || [])[0] || '',
    year: issued[0] ? String(issued[0]) : '',
    volume: msg.volume || '',
    issue: msg.issue || '',
    pages: msg.page || '',
    doi,
  }
}

async function fetchISBNMeta(isbn) {
  const clean = isbn.replace(/[-\s]/g, '')
  const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${clean}`)
  if (!res.ok) throw new Error('Could not fetch book metadata')
  const data = await res.json()
  const info = data.items?.[0]?.volumeInfo
  if (!info) throw new Error('No book found for that ISBN')
  const authors = (info.authors || []).map(a => {
    const parts = a.split(' ')
    const last = parts.pop() || ''
    const first = parts.join(' ')
    return first ? `${last}, ${first}` : last
  }).join('; ')
  const year = info.publishedDate ? info.publishedDate.slice(0, 4) : ''
  return {
    author: authors,
    title: info.title || '',
    publisher: info.publisher || '',
    place: '',
    year,
    edition: '',
  }
}

async function fetchWebMeta(url) {
  const res = await fetch(`${API_BASE}/api/meta?url=${encodeURIComponent(url)}`)
  if (!res.ok) throw new Error('Could not fetch page metadata')
  return { ...(await res.json()), url }
}

// ── Render *italic* markers ────────────────────────────────────────────────────
function CitationDisplay({ text }) {
  const parts = text.split(/\*([^*]+)\*/g)
  return (
    <p className="text-xs text-gray-700 leading-relaxed break-words select-all">
      {parts.map((part, i) => i % 2 === 1 ? <em key={i}>{part}</em> : part)}
    </p>
  )
}

function toPlainText(text) { return text.replace(/\*/g, '') }

// ── Component ─────────────────────────────────────────────────────────────────
export default function CitationGenerator() {
  const [style, setStyle] = useState('APA')
  const [source, setSource] = useState('Website')
  const [fields, setFields] = useState({})
  const [urlInput, setUrlInput] = useState('')
  const [fetching, setFetching] = useState(false)
  const [fetchError, setFetchError] = useState(null)
  const [copied, setCopied] = useState(false)
  const [view, setView] = useState('compose') // 'compose' | 'saved'
  const [saved, setSaved] = useState(loadSaved)
  const [copiedAll, setCopiedAll] = useState(false)
  const [copiedId, setCopiedId] = useState(null)

  const citation = generate(style, source, fields)

  async function handleAutoFill() {
    const input = urlInput.trim()
    if (!input) return
    setFetching(true)
    setFetchError(null)
    try {
      if (isISBN(input)) {
        setSource('Book')
        setFields(await fetchISBNMeta(input))
      } else {
        const detectedSource = detectSourceFromUrl(input)
        setSource(detectedSource)
        if (detectedSource === 'YouTube') setFields(await fetchYouTubeMeta(input))
        else if (detectedSource === 'Journal') setFields(await fetchDoiMeta(input))
        else setFields(await fetchWebMeta(input))
      }
    } catch (err) {
      setFetchError(err.message)
    } finally {
      setFetching(false)
    }
  }

  function handleSourceChange(s) {
    setSource(s)
    setFields({})
    setUrlInput('')
    setFetchError(null)
    setCopied(false)
  }

  function handleField(key, value) {
    setFields(prev => ({ ...prev, [key]: value }))
    setCopied(false)
  }

  function handleCopy() {
    if (!citation) return
    navigator.clipboard.writeText(toPlainText(citation))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleSave() {
    if (!citation) return
    const entry = { id: Date.now(), source, style, fields }
    const next = [...saved, entry]
    setSaved(next)
    persistSaved(next)
  }

  function handleRemove(id) {
    const next = saved.filter(e => e.id !== id)
    setSaved(next)
    persistSaved(next)
  }

  function handleCopyAll() {
    if (!saved.length) return
    const text = saved
      .map((e, i) => toPlainText(generate(style, e.source, e.fields)))
      .filter(Boolean)
      .join('\n\n')
    navigator.clipboard.writeText(text)
    setCopiedAll(true)
    setTimeout(() => setCopiedAll(false), 2000)
  }

  const currentFields = FIELDS[source]
  const fullFields = currentFields.filter(f => !f.half)
  const halfFields = currentFields.filter(f => f.half)

  return (
    <div className="h-full flex flex-col gap-2 overflow-hidden">

      {/* Style tabs */}
      <div className="flex gap-1 p-0.5 bg-gray-100 rounded-lg shrink-0">
        {STYLES.map(s => (
          <button key={s} onClick={() => { setStyle(s); setCopied(false) }}
            className={`flex-1 py-1 text-[10px] font-medium rounded-md transition-colors cursor-pointer
              ${style === s ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
            {s}
          </button>
        ))}
      </div>

      {/* View toggle */}
      <div className="flex gap-1 shrink-0">
        <button onClick={() => setView('compose')}
          className={`flex-1 py-1 text-xs font-medium rounded-lg border transition-colors cursor-pointer
            ${view === 'compose' ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 text-gray-500 hover:border-gray-400'}`}>
          Compose
        </button>
        <button onClick={() => setView('saved')}
          className={`flex-1 py-1 text-xs font-medium rounded-lg border transition-colors cursor-pointer
            ${view === 'saved' ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 text-gray-500 hover:border-gray-400'}`}>
          Saved {saved.length > 0 && `(${saved.length})`}
        </button>
      </div>

      {/* ── COMPOSE VIEW ───────────────────────────────────────────────────── */}
      {view === 'compose' && <>
        {/* Source tabs */}
        <div className="flex gap-1 shrink-0">
          {SOURCES.map(s => (
            <button key={s} onClick={() => handleSourceChange(s)}
              className={`flex-1 py-1 text-xs font-medium rounded-lg border transition-colors cursor-pointer
                ${source === s ? 'border-gray-500 bg-gray-500 text-white' : 'border-gray-200 text-gray-500 hover:border-gray-400'}`}>
              {s}
            </button>
          ))}
        </div>

        {/* URL / ISBN auto-fill */}
        <div className="flex gap-1.5 shrink-0">
          <input
            type="text"
            value={urlInput}
            onChange={e => setUrlInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAutoFill()}
            placeholder={
              source === 'YouTube' ? 'Paste YouTube URL…' :
              source === 'Journal'  ? 'Paste DOI URL…' :
              source === 'Book'     ? 'Paste ISBN or URL…' :
                                      'Paste URL to auto-fill…'
            }
            className="flex-1 min-w-0 px-2 py-1.5 text-xs rounded-lg border border-gray-200 bg-gray-50 focus:outline-none focus:border-gray-400 placeholder-gray-300"
          />
          <button
            onClick={handleAutoFill}
            disabled={!urlInput.trim() || fetching}
            className="px-2.5 py-1.5 text-xs font-medium rounded-lg bg-gray-900 text-white hover:bg-gray-700 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0 flex items-center"
          >
            {fetching ? <Spinner /> : 'Fill'}
          </button>
        </div>

        {fetchError && <p className="text-[10px] text-red-400 shrink-0 -mt-1">{fetchError}</p>}

        {/* Manual fields */}
        <div className="flex flex-col gap-1.5 overflow-y-auto min-h-0">
          {fullFields.map(field => (
            <div key={field.key}>
              <label className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">{field.label}</label>
              <input
                type="text"
                value={fields[field.key] || ''}
                onChange={e => handleField(field.key, e.target.value)}
                placeholder={field.placeholder}
                className="w-full mt-0.5 px-2 py-1.5 text-xs rounded-lg border border-gray-200 bg-gray-50 focus:outline-none focus:border-gray-400 placeholder-gray-300"
              />
            </div>
          ))}
          {halfFields.length > 0 && (
            <div className="grid grid-cols-3 gap-1.5">
              {halfFields.map(field => (
                <div key={field.key}>
                  <label className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">{field.label}</label>
                  <input
                    type="text"
                    value={fields[field.key] || ''}
                    onChange={e => handleField(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    className="w-full mt-0.5 px-2 py-1.5 text-xs rounded-lg border border-gray-200 bg-gray-50 focus:outline-none focus:border-gray-400 placeholder-gray-300"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Output */}
        {citation ? (
          <div className="mt-auto shrink-0 rounded-lg border border-gray-200 bg-gray-50 p-2.5">
            <CitationDisplay text={citation} />
            <div className="flex gap-1.5 mt-2">
              <button onClick={handleCopy}
                className="flex-1 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer bg-gray-900 text-white hover:bg-gray-700">
                {copied ? 'Copied!' : 'Copy'}
              </button>
              <button onClick={handleSave}
                className="flex-1 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer border border-gray-300 text-gray-600 hover:border-gray-500 hover:text-gray-800">
                Save to List
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-auto shrink-0 rounded-lg border border-dashed border-gray-200 p-2.5 text-center">
            <p className="text-xs text-gray-300">Paste a URL, DOI, or ISBN — or fill in fields</p>
          </div>
        )}
      </>}

      {/* ── SAVED VIEW ─────────────────────────────────────────────────────── */}
      {view === 'saved' && (
        <div className="flex flex-col gap-2 min-h-0 flex-1 overflow-hidden">
          {saved.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-xs text-gray-300 text-center">No saved citations yet.<br/>Compose one and click "Save to List".</p>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto flex flex-col gap-2">
                {saved.map((entry) => {
                  const text = generate(style, entry.source, entry.fields)
                  return (
                    <div key={entry.id} className="rounded-lg border border-gray-200 bg-gray-50 p-2.5 flex flex-col gap-2">
                      {/* Header row: tags + actions */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-gray-200 text-gray-600 uppercase tracking-wide">
                          {entry.source}
                        </span>
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-gray-900 text-white uppercase tracking-wide">
                          {entry.style || style}
                        </span>
                        <div className="ml-auto flex items-center gap-1">
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(toPlainText(text))
                              setCopiedId(entry.id)
                              setTimeout(() => setCopiedId(null), 2000)
                            }}
                            className="px-2 py-0.5 text-[10px] font-medium rounded border border-gray-300 text-gray-500 hover:border-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
                          >
                            {copiedId === entry.id ? 'Copied!' : 'Copy'}
                          </button>
                          <button
                            onClick={() => handleRemove(entry.id)}
                            className="text-gray-300 hover:text-gray-500 cursor-pointer text-xs leading-none px-1"
                            aria-label="Remove"
                          >✕</button>
                        </div>
                      </div>
                      <CitationDisplay text={text || '—'} />
                    </div>
                  )
                })}
              </div>
              <button
                onClick={handleCopyAll}
                className="shrink-0 w-full py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer bg-gray-900 text-white hover:bg-gray-700"
              >
                {copiedAll ? 'Copied!' : `Copy All (${saved.length})`}
              </button>
            </>
          )}
        </div>
      )}

    </div>
  )
}

function Spinner() {
  return (
    <svg className="animate-spin" width="13" height="13" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M12 2a10 10 0 1 0 10 10" />
    </svg>
  )
}
