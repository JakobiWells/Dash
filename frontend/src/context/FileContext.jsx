import { createContext, useContext, useState, useCallback } from 'react'

const FileContext = createContext({ files: [], addFile: () => {}, removeFile: () => {} })

export function FileProvider({ children }) {
  const [files, setFiles] = useState([])

  const addFile = useCallback((file) => {
    setFiles(prev => [...prev, file])
  }, [])

  const removeFile = useCallback((id) => {
    setFiles(prev => {
      const f = prev.find(f => f.id === id)
      if (f?.objectUrl) URL.revokeObjectURL(f.objectUrl)
      return prev.filter(f => f.id !== id)
    })
  }, [])

  return (
    <FileContext.Provider value={{ files, addFile, removeFile }}>
      {children}
    </FileContext.Provider>
  )
}

export const useDashFiles = () => useContext(FileContext)
