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
        if (!credentials?.email || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        })

        if (!user || !user.password) return null

        const isValid = await bcrypt.compare(credentials.password, user.password)
        if (!isValid) return null

        return user as any
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