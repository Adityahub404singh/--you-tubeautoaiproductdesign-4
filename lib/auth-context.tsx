"use client"
import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

interface User {
  id: string; email: string; name: string; phone: string
  role: string; plan: string; hasCompletedSetup: boolean
  freeVideosUsed: number; paidVideoCredits: number
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<boolean>
  signup: (name: string, email: string, password: string, phone: string) => Promise<boolean>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const syncUser = async () => {
    // 1. Check Session Storage first
    const stored = sessionStorage.getItem("currentUser")
    if (stored) {
      try { setUser(JSON.parse(stored)); setIsLoading(false); return } catch {}
    }
    
    // 2. Fallback to server session if storage empty
    try {
      const res = await fetch("/api/auth/session")
      if (res.ok) {
        const data = await res.json()
        if (data.user) {
          setUser(data.user)
          sessionStorage.setItem("currentUser", JSON.stringify(data.user))
        }
      }
    } catch {}
    setIsLoading(false)
  }

  useEffect(() => { syncUser() }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    const res = await fetch("/api/auth/login", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    })
    const data = await res.json()
    if (data.success && data.user) {
      setUser(data.user)
      sessionStorage.setItem("currentUser", JSON.stringify(data.user))
      return true
    }
    return false
  }

  const signup = async (name: string, email: string, password: string, phone: string): Promise<boolean> => {
    const res = await fetch("/api/auth/signup", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, phone })
    })
    const data = await res.json()
    if (data.success && data.user) {
      setUser(data.user)
      sessionStorage.setItem("currentUser", JSON.stringify(data.user))
      return true
    }
    return false
  }

  const logout = () => {
    setUser(null)
    sessionStorage.removeItem("currentUser")
    fetch("/api/auth/logout") // Cleanup session
  }

  return <AuthContext.Provider value={{ user, login, signup, logout, isLoading }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
