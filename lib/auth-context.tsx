"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { store, type User } from "./store"

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

  useEffect(() => {
    const storedUser = localStorage.getItem("currentUser")
    if (storedUser) {
      const userData = JSON.parse(storedUser)
      const foundUser = store?.getUserByEmail(userData.email)
      if (foundUser) {
        setUser(foundUser)
      }
    }
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      if (!store) return false

      const passwords = JSON.parse(localStorage.getItem("passwords") || "{}")
      if (passwords[email] !== password) return false

      const foundUser = store.getUserByEmail(email)
      if (foundUser) {
        setUser(foundUser)
        localStorage.setItem("currentUser", JSON.stringify(foundUser))
        return true
      }
      return false
    } catch (error) {
      console.error("[v0] Login error:", error)
      return false
    }
  }

  const signup = async (name: string, email: string, password: string, phone: string): Promise<boolean> => {
    try {
      if (!store) return false

      if (store.getUserByEmail(email)) {
        return false
      }

      const passwords = JSON.parse(localStorage.getItem("passwords") || "{}")
      passwords[email] = password
      localStorage.setItem("passwords", JSON.stringify(passwords))

      const isAdmin = email === "admin@youtubeauto.ai"

      const newUser = store.createUser({
        email,
        name,
        phone,
        role: isAdmin ? "admin" : "user",
        plan: isAdmin ? "agency" : "free",
        hasCompletedSetup: isAdmin,
      })

      setUser(newUser)
      localStorage.setItem("currentUser", JSON.stringify(newUser))
      return true
    } catch (error) {
      console.error("[v0] Signup error:", error)
      return false
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("currentUser")
  }

  return <AuthContext.Provider value={{ user, login, signup, logout, isLoading }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
