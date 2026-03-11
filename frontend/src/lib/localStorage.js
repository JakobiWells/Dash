export function loadJSON(key, defaultValue = null) {
  try {
    const raw = localStorage.getItem(key)
    return raw !== null ? JSON.parse(raw) : defaultValue
  } catch {
    return defaultValue
  }
}

export function saveJSON(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch {}
}
