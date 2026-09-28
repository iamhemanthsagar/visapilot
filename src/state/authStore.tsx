import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

export type AuthUser = {
  id: string
  email: string
  name: string
  role: 'COUNSEL' | 'CANDIDATE' | 'CONSULTANT'
  token: string
}

type AuthContextValue = {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password?: string) => Promise<boolean>
  register: (email: string, password?: string) => Promise<boolean>
  logout: () => void
}

const STORAGE_KEY = 'visapilot_auth_session'

const AuthContext = createContext<AuthContextValue | null>(null)

function deriveNameFromEmail(email: string): string {
  const localPart = email.split('@')[0] || 'User'
  return localPart
    .split(/[._-]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })
  const [isLoading, setIsLoading] = useState(false)

  // Check Cloudflare Access session on mount
  useEffect(() => {
    let isMounted = true
    async function checkCloudflareAuth() {
      try {
        const res = await fetch('/api/auth/me')
        if (res.ok) {
          const data = await res.json()
          if (data && data.authenticated && data.user && isMounted) {
            setUser(data.user)
          }
        }
      } catch {
        // Fallback silently to localStorage session
      }
    }
    checkCloudflareAuth()
    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    try {
      if (user) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
      } else {
        localStorage.removeItem(STORAGE_KEY)
      }
    } catch {
      // Ignore localStorage write failures in private/sandboxed mode
    }
  }, [user])

  const login = async (email: string, _password?: string): Promise<boolean> => {
    setIsLoading(true)
    try {
      const cleanEmail = email.trim().toLowerCase()
      const newUser: AuthUser = {
        id: `usr_${Date.now()}`,
        email: cleanEmail,
        name: deriveNameFromEmail(cleanEmail),
        role: cleanEmail.includes('counsel') || cleanEmail.includes('law') ? 'COUNSEL' : 'CONSULTANT',
        token: `vp_tok_${btoa(`${cleanEmail}:${Date.now()}`)}`,
      }
      setUser(newUser)
      return true
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (email: string, _password?: string): Promise<boolean> => {
    return login(email, _password)
  }

  const logout = () => {
    setUser(null)
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // Ignore storage errors
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
