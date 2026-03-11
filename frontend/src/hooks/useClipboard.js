import { useState, useCallback } from 'react'

export default function useClipboard(timeout = 1500) {
  const [copied, setCopied] = useState(false)
  const copy = useCallback((text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), timeout)
    })
  }, [timeout])
  return { copied, copy }
}
