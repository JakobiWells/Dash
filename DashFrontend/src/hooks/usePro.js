import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export function usePro() {
  const { user } = useAuth()
  const [isPro, setIsPro] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user || !supabase) { setIsPro(false); setLoading(false); return }

    supabase
      .from('profiles')
      .select('is_pro')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        setIsPro(data?.is_pro ?? false)
        setLoading(false)
      })
      .catch(() => { setIsPro(false); setLoading(false) })
  }, [user])

  return { isPro, loading }
}
