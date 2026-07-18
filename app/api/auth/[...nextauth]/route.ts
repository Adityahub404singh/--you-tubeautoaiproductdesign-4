import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "../../../../lib/prisma";

const handler = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email) return null;
        
        try {
          let user = await prisma.user.findUnique({
            where: { email: credentials.email }
          });
          
          if (!user) {
            user = await prisma.user.create({
              data: {
                email: credentials.email,
                name: "Admin User",
              }
            });
          }
          
          return user as any;
        } catch (e) {
          console.error("Auth Error:", e);
          return null;
        }
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
