import { createContext, useContext } from 'react'

export const GuideContext = createContext(null)

export function useGuide() {
  const ctx = useContext(GuideContext)
  if (!ctx) throw new Error('useGuide must be used inside GuideContext.Provider')
  return ctx
}
