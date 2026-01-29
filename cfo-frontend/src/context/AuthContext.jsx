// src/context/AuthContext.jsx
// Layer 1: Minimal auth with magic link - tracks user session, no profile fetch

import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // Magic link authentication
  // For new users, pass metadata: { full_name, company, position }
  // For existing users, metadata is ignored by Supabase
  const signInWithMagicLink = async (email, metadata = {}) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/login`,
        data: metadata,
      },
    })
    return { error }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  // User metadata from auth (full_name, company, position)
  const userMetadata = user?.user_metadata || {}

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      signInWithMagicLink,
      signOut,
      isAuthenticated: !!user,
      userMetadata,
    }}>
      {children}
    </AuthContext.Provider>
  )
}
