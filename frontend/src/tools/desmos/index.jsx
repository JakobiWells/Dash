import { useEffect, useRef } from 'react'

const DESMOS_SRC = 'https://www.desmos.com/api/v1.9/calculator.js?apiKey=dcb31709b452b1cf9dc26972add0fda6'
const STORAGE_KEY = 'dashpad-desmos-state'

function loadScript() {
  return new Promise((resolve, reject) => {
    // Already loaded
    if (window.Desmos) { resolve(); return }
    // Script tag exists but still loading — poll for Desmos global
    if (document.querySelector(`script[src="${DESMOS_SRC}"]`)) {
      const iv = setInterval(() => { if (window.Desmos) { clearInterval(iv); resolve() } }, 50)
      return
    }
    const s = document.createElement('script')
    s.src = DESMOS_SRC
    s.onload = resolve
    s.onerror = reject
    document.head.appendChild(s)
  })
}

export default function Desmos() {
  const containerRef = useRef(null)
  const calcRef = useRef(null)

  useEffect(() => {
    let active = true

    loadScript().then(() => {
      if (!active || !containerRef.current || !window.Desmos) return

      const isDark = document.documentElement.classList.contains('dark')

      const calc = window.Desmos.GraphingCalculator(containerRef.current, {
        border: false,
        keypad: true,
        expressions: true,
        settingsMenu: true,
        zoomButtons: true,
        expressionsTopbar: true,
        pointsOfInterest: true,
        trace: true,
        lockViewport: false,
        invertedColors: isDark,
      })

      // Restore saved state
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        try { calc.setState(JSON.parse(saved)) } catch {}
      }

      // Persist state on every change
      calc.observeEvent('change', () => {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(calc.getState())) } catch {}
      })

      calcRef.current = calc
    }).catch(console.error)

    return () => {
      active = false
      calcRef.current?.destroy()
      calcRef.current = null
    }
  }, [])

  // Sync dark mode changes to the calculator
  useEffect(() => {
    const observer = new MutationObserver(() => {
      if (!calcRef.current) return
      const isDark = document.documentElement.classList.contains('dark')
      calcRef.current.updateSettings({ invertedColors: isDark })
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  // Negate ToolCard's p-4 padding so the calculator fills edge-to-edge
  return <div ref={containerRef} className="w-[calc(100%+2rem)] h-[calc(100%+2rem)] -m-4" />
}
