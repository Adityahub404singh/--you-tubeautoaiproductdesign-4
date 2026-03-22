import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "openid email profile https://www.googleapis.com/auth/youtube",
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },
  cookies: {
    pkceCodeVerifier: {
      name: "next-auth.pkce.code_verifier",
      options: { httpOnly: true, sameSite: "lax", path: "/", secure: false },
    },
    state: {
      name: "next-auth.state",
      options: { httpOnly: true, sameSite: "lax", path: "/", secure: false },
    },
    callbackUrl: {
      name: "next-auth.callback-url",
      options: { httpOnly: true, sameSite: "lax", path: "/", secure: false },
    },
    csrfToken: {
      name: "next-auth.csrf-token",
      options: { httpOnly: true, sameSite: "lax", path: "/", secure: false },
    },
  },
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token
        token.refreshToken = account.refresh_token
      }
      return token
    },
    async session({ session, token }) {
      (session as any).accessToken = token.accessToken as string
      return session
    },
  },
})

export { handler as GET, handler as POST }
