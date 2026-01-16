import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react'
import { supabase } from './api/supabaseClient'

export type Session = {
  token: string
  user: {
    id: string
    email: string
    isAdmin: boolean
    fullName?: string | null
    asuId?: string | null
    discipline?: string | null
  }
}

type SessionContextValue = {
  session: Session | null
  setSession: (next: Session | null) => void
  clearSession: () => void
}

const SessionContext = createContext<SessionContextValue | undefined>(undefined)

const SESSION_STORAGE_KEY = 'teeds.v1.session'

export const SessionProvider = ({ children }: PropsWithChildren) => {
  const [session, setSessionState] = useState<Session | null>(() => {
    if (typeof window === 'undefined') {
      return null
    }
    try {
      const stored = window.localStorage.getItem(SESSION_STORAGE_KEY)
      return stored ? (JSON.parse(stored) as Session) : null
    } catch (error) {
      console.warn('Unable to hydrate session from localStorage', error)
      return null
    }
  })

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }
    try {
      if (session) {
        window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session))
      } else {
        window.localStorage.removeItem(SESSION_STORAGE_KEY)
      }
    } catch (error) {
      console.warn('Unable to persist session to localStorage', error)
    }
  }, [session])

  useEffect(() => {
    // Keep supabase auth header in sync with our custom session token
    if (session?.token) {
      supabase.auth.setAuth(session.token)
    } else {
      supabase.auth.setAuth('')
    }
  }, [session?.token])

  const setSession = (next: Session | null) => setSessionState(next)
  const clearSession = () => setSessionState(null)

  const value = useMemo(
    () => ({
      session,
      setSession,
      clearSession,
    }),
    [session],
  )

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export const useSession = () => {
  const context = useContext(SessionContext)
  if (!context) {
    throw new Error('useSession must be used inside SessionProvider')
  }
  return context
}
