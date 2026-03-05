// Vite's import.meta.glob eagerly loads all tool manifests and components.
// Each tool lives at src/tools/<id>/index.jsx + manifest.json

const manifests = import.meta.glob('../tools/*/manifest.json', { eager: true })
const components = import.meta.glob('../tools/*/index.jsx', { eager: true })

function buildRegistry() {
  const registry = {}

  for (const path in manifests) {
    const manifest = manifests[path].default ?? manifests[path]
    const componentPath = path.replace('manifest.json', 'index.jsx')
    const Component = components[componentPath]?.default

    if (manifest?.id && Component) {
      registry[manifest.id] = { manifest, Component }
    }
  }

  return registry
}

export const registry = buildRegistry()

export function getTools() {
  return Object.values(registry).map((entry) => entry.manifest)
}

export function getComponent(id) {
  return registry[id]?.Component ?? null
}
