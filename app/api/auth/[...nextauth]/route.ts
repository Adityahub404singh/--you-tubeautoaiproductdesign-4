import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

const handler = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      authorization: {
        params: { prompt: "consent", access_type: "offline", response_type: "code" },
      },
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          console.log("AUTH DEBUG: step 1 - received email:", credentials?.email)

          if (!credentials?.email || !credentials?.password) {
            console.log("AUTH DEBUG: step 2 - missing email or password")
            return null
          }

          console.log("AUTH DEBUG: step 3 - querying prisma...")
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
          })
          console.log("AUTH DEBUG: step 4 - user found?", !!user)
          console.log("AUTH DEBUG: step 5 - has password field?", !!user?.password)

          if (!user || !user.password) {
            console.log("AUTH DEBUG: step 6 - returning null, no user or no password")
            return null
          }

          console.log("AUTH DEBUG: step 7 - comparing bcrypt...")
          const isValid = await bcrypt.compare(credentials.password, user.password)
          console.log("AUTH DEBUG: step 8 - password valid?", isValid)

          if (!isValid) return null

          console.log("AUTH DEBUG: step 9 - SUCCESS, returning user")
          return user as any
        } catch (err: any) {
          console.log("AUTH DEBUG: CRASHED with error:", err?.message, err?.stack)
          return null
        }
      },
    }),
  ],
  callbacks: {
    async session({ session, token }: any) {
      if (session.user && token.sub) session.user.id = token.sub
      return session
    },
    async jwt({ token, user }: any) {
      if (user) token.sub = user.id
      return token
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
})

export { handler as GET, handler as POST }