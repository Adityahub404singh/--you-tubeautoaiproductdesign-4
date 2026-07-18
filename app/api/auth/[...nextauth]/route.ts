import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";

const handler = NextAuth({
  // ⚠️ PRISMA ADAPTER HATA DIYA HAI (No DB Connection required for login)
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "dummy",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "dummy",
    }),
    
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email) return null;
        
        // 🔥 GOD MODE: Database search bypass! 
        // Seedha login allow kar do kisi bhi password ke sath.
        return {
          id: "god-mode-123",
          name: "Admin User",
          email: credentials.email
        } as any;
      }
    })
  ],
  
  callbacks: {
    async session({ session, token }: any) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
    async jwt({ token, user }: any) {
      if (user) {
        token.sub = user.id;
      }
      return token;
    }
  },
  
  secret: process.env.NEXTAUTH_SECRET || "fallback_secret_for_jwt_token_123",
});

export { handler as GET, handler as POST };