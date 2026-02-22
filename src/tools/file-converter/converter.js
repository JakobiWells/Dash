// ─── Helpers ────────────────────────────────────────────────────────────────

const IMAGE_EXTS  = new Set(['png','jpg','jpeg','webp','gif','bmp','tiff','svg'])
const AUDIO_EXTS  = new Set(['mp3','wav','ogg','flac','m4a','aac'])
const VIDEO_EXTS  = new Set(['mp4','mov','avi','webm','mkv'])

export function getCategory(ext) {
  if (IMAGE_EXTS.has(ext))  return 'image'
  if (AUDIO_EXTS.has(ext))  return 'audio'
  if (VIDEO_EXTS.has(ext))  return 'video'
  return 'document'
}

function download(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function outputFilename(originalName, outputExt) {
  const base = originalName.replace(/\.[^.]+$/, '')
  return `${base}.${outputExt}`
}

// ─── Main entry point ────────────────────────────────────────────────────────

export async function convert(file, inputExt, outputFormat, onProgress) {
  const category = getCategory(inputExt)
  let blob

  if (category === 'image') {
    blob = await convertImage(file, outputFormat)
  } else if (category === 'audio' || category === 'video') {
    blob = await convertMedia(file, inputExt, outputFormat, onProgress)
  } else {
    blob = await convertDocument(file, inputExt, outputFormat)
  }

  download(blob, outputFilename(file.name, outputFormat))
}

// ─── Image (Canvas API) ──────────────────────────────────────────────────────

const IMAGE_MIME = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp' }

async function convertImage(file, outputFormat) {
  const mime = IMAGE_MIME[outputFormat]
  if (!mime) throw new Error(`.${outputFormat} output is not supported for images in-browser. Try PNG, JPG, or WebP.`)

  const url = URL.createObjectURL(file)
  const img = new Image()
  await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = url })

  const canvas = document.createElement('canvas')
  canvas.width  = img.naturalWidth
  canvas.height = img.naturalHeight
  const ctx = canvas.getContext('2d')

  // White background so transparent PNGs look correct when saved as JPG
  if (outputFormat === 'jpg' || outputFormat === 'jpeg') {
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }

  ctx.drawImage(img, 0, 0)
  URL.revokeObjectURL(url)

  const blob = await new Promise((res) => canvas.toBlob(res, mime, 0.92))
  if (!blob) throw new Error('Canvas failed to produce output blob.')
  return blob
}

// ─── Audio / Video (FFmpeg.wasm) ─────────────────────────────────────────────

let _ffmpeg = null

async function getFFmpeg(onProgress) {
  const { FFmpeg } = await import('@ffmpeg/ffmpeg')

  if (!_ffmpeg) {
    _ffmpeg = new FFmpeg()
    _ffmpeg.on('progress', ({ progress }) => onProgress?.(Math.min(progress, 1)))
  }

  if (!_ffmpeg.loaded) {
    await _ffmpeg.load({
      coreURL: '/ffmpeg/ffmpeg-core.js',
      wasmURL: '/ffmpeg/ffmpeg-core.wasm',
    })
  }

  return _ffmpeg
}

async function convertMedia(file, inputExt, outputFormat, onProgress) {
  const { fetchFile } = await import('@ffmpeg/util')
  const ff = await getFFmpeg(onProgress)

  const inputName  = `input.${inputExt}`
  const outputName = `output.${outputFormat}`

  await ff.writeFile(inputName, await fetchFile(file))
  await ff.exec(['-i', inputName, outputName])

  const data = await ff.readFile(outputName)
  await ff.deleteFile(inputName)
  await ff.deleteFile(outputName)

  return new Blob([data.buffer], { type: mimeForExt(outputFormat) })
}

function mimeForExt(ext) {
  const map = {
    mp3: 'audio/mpeg', wav: 'audio/wav', ogg: 'audio/ogg',
    flac: 'audio/flac', m4a: 'audio/mp4', aac: 'audio/aac',
    mp4: 'video/mp4', mov: 'video/quicktime', avi: 'video/x-msvideo',
    webm: 'video/webm', mkv: 'video/x-matroska', gif: 'image/gif',
  }
  return map[ext] ?? 'application/octet-stream'
}

// ─── Documents ───────────────────────────────────────────────────────────────

async function convertDocument(file, inputExt, outputFormat) {
  const text = await file.text()

  // ── TXT / MD ──────────────────────────────────────────────────────────────
  if (inputExt === 'txt' || inputExt === 'md') {
    if (outputFormat === 'txt')  return textBlob(text)
    if (outputFormat === 'md')   return textBlob(text)
    if (outputFormat === 'html') return textBlob(await mdToHtml(text), 'text/html')
    if (outputFormat === 'pdf')  return await textToPdf(text)
    if (outputFormat === 'docx') return await textToDocx(text)
  }

  // ── HTML ──────────────────────────────────────────────────────────────────
  if (inputExt === 'html') {
    if (outputFormat === 'txt') return textBlob(htmlToText(text))
    if (outputFormat === 'md')  return textBlob(htmlToText(text)) // basic strip
    if (outputFormat === 'pdf') return await htmlToPdf(text)
  }

  // ── CSV ───────────────────────────────────────────────────────────────────
  if (inputExt === 'csv') {
    if (outputFormat === 'xlsx') return await csvToXlsx(file)
    if (outputFormat === 'pdf')  return await csvToPdf(text)
  }

  // ── XLSX / XLS ────────────────────────────────────────────────────────────
  if (inputExt === 'xlsx' || inputExt === 'xls') {
    if (outputFormat === 'csv') return await xlsToCsv(file)
    if (outputFormat === 'pdf') return await xlsToPdf(file)
  }

  // ── DOCX ──────────────────────────────────────────────────────────────────
  if (inputExt === 'docx' || inputExt === 'doc') {
    if (outputFormat === 'html') return await docxToHtml(file)
    if (outputFormat === 'txt')  return await docxToText(file)
    if (outputFormat === 'pdf')  return await docxToPdf(file)
    if (outputFormat === 'md')   return await docxToText(file) // plain text is close enough
  }

  // ── PDF ───────────────────────────────────────────────────────────────────
  if (inputExt === 'pdf') {
    if (outputFormat === 'txt')        return await pdfToText(file)
    if (outputFormat === 'png' || outputFormat === 'jpg') return await pdfToImage(file, outputFormat)
    if (outputFormat === 'docx')       return await pdfToDocxFallback(file)
  }

  throw new Error(`Conversion from .${inputExt} to .${outputFormat} is not yet supported.`)
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function textBlob(str, mime = 'text/plain') {
  return new Blob([str], { type: mime })
}

function htmlToText(html) {
  const div = document.createElement('div')
  div.innerHTML = html
  return div.innerText
}

async function mdToHtml(md) {
  const { marked } = await import('marked')
  return marked(md)
}

async function textToPdf(text) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF()
  const lines = doc.splitTextToSize(text, 180)
  doc.text(lines, 10, 10)
  return doc.output('blob')
}

async function htmlToPdf(html) {
  // Render HTML as plain text for PDF (full HTML rendering requires html2canvas)
  return textToPdf(htmlToText(html))
}

async function textToDocx(text) {
  // Build a minimal DOCX (ZIP with XML) using docx library
  const { Document, Packer, Paragraph } = await import('docx')
  const paragraphs = text.split('\n').map(line => new Paragraph(line))
  const doc = new Document({ sections: [{ children: paragraphs }] })
  const buffer = await Packer.toBlob(doc)
  return buffer
}

async function docxToHtml(file) {
  const mammoth = await import('mammoth')
  const result = await mammoth.convertToHtml({ arrayBuffer: await file.arrayBuffer() })
  return textBlob(result.value, 'text/html')
}

async function docxToText(file) {
  const mammoth = await import('mammoth')
  const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() })
  return textBlob(result.value)
}

async function docxToPdf(file) {
  const mammoth = await import('mammoth')
  const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() })
  return textToPdf(result.value)
}

async function pdfToText(file) {
  const pdfjs = await import('pdfjs-dist')
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).href

  const pdf = await pdfjs.getDocument(await file.arrayBuffer()).promise
  let fullText = ''
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    fullText += content.items.map(item => item.str).join(' ') + '\n'
  }
  return textBlob(fullText)
}

async function pdfToImage(file, outputFormat) {
  const pdfjs = await import('pdfjs-dist')
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).href

  const pdf = await pdfjs.getDocument(await file.arrayBuffer()).promise
  const page = await pdf.getPage(1)
  const viewport = page.getViewport({ scale: 2 })

  const canvas = document.createElement('canvas')
  canvas.width  = viewport.width
  canvas.height = viewport.height
  await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise

  const mime = outputFormat === 'jpg' ? 'image/jpeg' : 'image/png'
  return new Promise(res => canvas.toBlob(res, mime, 0.92))
}

async function pdfToDocxFallback(file) {
  // Extract text then build DOCX — best effort (no layout preservation)
  const textBlob_ = await pdfToText(file)
  const text = await textBlob_.text()
  return textToDocx(text)
}

async function csvToXlsx(file) {
  const XLSX = await import('xlsx')
  const text = await file.text()
  const wb = XLSX.read(text, { type: 'string' })
  const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' })
  return new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
}

async function xlsToCsv(file) {
  const XLSX = await import('xlsx')
  const wb = XLSX.read(await file.arrayBuffer(), { type: 'array' })
  const csv = XLSX.utils.sheet_to_csv(wb.Sheets[wb.SheetNames[0]])
  return textBlob(csv)
}

async function xlsToPdf(file) {
  const XLSX = await import('xlsx')
  const wb = XLSX.read(await file.arrayBuffer(), { type: 'array' })
  const csv = XLSX.utils.sheet_to_csv(wb.Sheets[wb.SheetNames[0]])
  return csvToPdf(csv)
}

async function csvToPdf(csvText) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF()
  const rows = csvText.trim().split('\n').map(r => r.split(','))
  let y = 10
  for (const row of rows) {
    doc.setFontSize(9)
    doc.text(row.join('   '), 10, y)
    y += 6
    if (y > 280) { doc.addPage(); y = 10 }
  }
  return doc.output('blob')
}
