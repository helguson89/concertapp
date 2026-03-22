import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User as SupabaseUser, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface AuthContextType {
  user: SupabaseUser | null
  session: Session | null
  displayName: string
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signUp: (email: string, password: string, displayName: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [displayName, setDisplayName] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) fetchDisplayName(session.user.id, session.user.email)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) fetchDisplayName(session.user.id, session.user.email)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchDisplayName(userId: string, email?: string) {
    const { data } = await supabase
      .from('users')
      .select('display_name')
      .eq('id', userId)
      .single()
    if (data) {
      setDisplayName(data.display_name)
    } else if (email) {
      // Profile missing (e.g. email confirmation interrupted signup) — create it
      const fallback = email.split('@')[0]
      await supabase.from('users').upsert({ id: userId, email, display_name: fallback })
      setDisplayName(fallback)
    }
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }

  async function signUp(email: string, password: string, displayName: string) {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (!error && data.user) {
      await supabase.from('users').insert({
        id: data.user.id,
        email,
        display_name: displayName,
      })
      setDisplayName(displayName)
    }
    return { error }
  }

  async function signOut() {
    await supabase.auth.signOut()
    setDisplayName('')
  }

  return (
    <AuthContext.Provider value={{ user, session, displayName, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
