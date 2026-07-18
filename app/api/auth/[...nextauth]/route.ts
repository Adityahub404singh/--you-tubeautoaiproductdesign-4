import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";

const handler = NextAuth({
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 }, // 30 din ka session
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: { email: { label: "Email", type: "email" }, password: { label: "Password", type: "password" } },
      async authorize(credentials) {
        if (!credentials?.email) return null;
        return { id: "god-mode-123", name: "Admin User", email: credentials.email } as any;
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) token.sub = user.id;
      return token;
    },
    async session({ session, token }: any) {
      if (session.user) session.user.id = token.sub as string;
      return session;
    }
  },
  secret: "super_secret_key_12345", // Fixed secret
});

export { handler as GET, handler as POST };
