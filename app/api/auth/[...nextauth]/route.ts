import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { createClient } from "@libsql/client"

const handler = NextAuth({
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        try {
          const db = createClient({
            url: process.env.DATABASE_URL,
            authToken: process.env.TURSO_AUTH_TOKEN,
          })
          const result = await db.execute({
            sql: "SELECT * FROM User WHERE email=?",
            args: [credentials.email.toLowerCase().trim()]
          })
          if (result.rows.length === 0) return null
          const u = result.rows[0]
          if (u.password) {
            const valid = await bcrypt.compare(credentials.password, u.password)
            if (!valid) return null
          }
          return { id: u.id, email: u.email, name: u.name, role: u.role, plan: u.plan }
        } catch { return null }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) { token.role = user.role; token.plan = user.plan }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role
        session.user.plan = token.plan
        session.user.id = token.sub
      }
      return session
    }
  }
})

export { handler as GET, handler as POST }
