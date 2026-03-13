// Auto-discovers all .md files in src/guides/ at build time via Vite's import.meta.glob.
// Each file must have YAML frontmatter between --- delimiters.
//
// Frontmatter fields:
//   title       (string, required)  — displayed in panel header and guide list
//   description (string)            — short summary shown in browse list
//   toolId      (string)            — if set, links this guide to a tool's ? button
//   tags        (array)             — e.g. [math, graphing]
//   icon        (string)            — emoji used in the browse list

const rawModules = import.meta.glob('./**/*.md', { as: 'raw', eager: true })

function parseFrontmatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/)
  if (!match) return { meta: {}, content: raw.trim() }

  const meta = {}
  match[1].split('\n').forEach(line => {
    const colon = line.indexOf(':')
    if (colon === -1) return
    const key = line.slice(0, colon).trim()
    const val = line.slice(colon + 1).trim()
    if (val.startsWith('[') && val.endsWith(']')) {
      meta[key] = val.slice(1, -1).split(',').map(s => s.trim()).filter(Boolean)
    } else {
      meta[key] = val
    }
  })

  return { meta, content: match[2].trim() }
}

export const GUIDES = Object.entries(rawModules).map(([path, raw]) => {
  const { meta, content } = parseFrontmatter(raw)
  // './tools/desmos.md' → 'tools/desmos',  './getting-started.md' → 'getting-started'
  const id = path.replace(/^\.\//, '').replace(/\.md$/, '')
  return {
    id,
    toolId:      meta.toolId      || null,
    title:       meta.title       || id,
    description: meta.description || '',
    tags:        meta.tags        || [],
    icon:        meta.icon        || '📄',
    content,
  }
}).sort((a, b) => {
  // General guides first, then tool guides alphabetically
  if (!a.toolId && b.toolId) return -1
  if (a.toolId && !b.toolId) return 1
  return a.title.localeCompare(b.title)
})

export function getGuideByToolId(toolId) {
  return GUIDES.find(g => g.toolId === toolId) ?? null
}

export function getGuideById(id) {
  return GUIDES.find(g => g.id === id) ?? null
}

export default GUIDES
