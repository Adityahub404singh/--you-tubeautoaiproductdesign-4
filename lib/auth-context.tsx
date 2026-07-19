"use client"
import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { signIn, signOut, useSession } from "next-auth/react"

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
  const { data: session, status } = useSession()
  const [extraData, setExtraData] = useState<Partial<User>>({})

  const user: User | null = session?.user ? {
    id: (session.user as any).id || "",
    email: session.user.email || "",
    name: session.user.name || "",
    phone: extraData.phone || "",
    role: (session.user as any).role || "user",
    plan: (session.user as any).plan || "free",
    hasCompletedSetup: extraData.hasCompletedSetup ?? true,
    freeVideosUsed: extraData.freeVideosUsed || 0,
    paidVideoCredits: extraData.paidVideoCredits || 0,
  } : null

  const login = async (email: string, password: string): Promise<boolean> => {
    const result = await signIn("credentials", { email, password, redirect: false })
    return !result?.error
  }

  const signup = async (name: string, email: string, password: string, phone: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, phone })
      })
      const data = await res.json()
      if (!data.success) return false
      const result = await signIn("credentials", { email, password, redirect: false })
      return !result?.error
    } catch { return false }
  }

  const logout = () => signOut({ callbackUrl: "/login" })

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, isLoading: status === "loading" }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
