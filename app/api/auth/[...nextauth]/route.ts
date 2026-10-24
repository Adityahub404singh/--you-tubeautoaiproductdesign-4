
import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },

  providers: [
    GoogleProvider({
      clientId:
        process.env.GOOGLE_CLIENT_ID ||
        process.env.YOUTUBE_CLIENT_ID ||
        "",
      clientSecret:
        process.env.GOOGLE_CLIENT_SECRET ||
        process.env.YOUTUBE_CLIENT_SECRET ||
        "",
    }),

    CredentialsProvider({
      name: "credentials",

      credentials: {
        email: {
          label: "Email",
          type: "email",
        },
        password: {
          label: "Password",
          type: "password",
        },
      },

      async authorize(credentials) {
        if (
          !credentials?.email ||
          !credentials?.password
        ) {
          return null;
        }

        try {
          const cleanEmail = credentials.email
            .toLowerCase()
            .trim();

          const user = await prisma.user.findUnique({
            where: {
              email: cleanEmail,
            },
          });

          // User must exist and have a password hash.
          if (!user || !user.password) {
            return null;
          }

          const valid = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (!valid) {
            return null;
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role || "user",
            plan: user.plan || "free",
          };
        } catch (error: unknown) {
          console.error(
            "[NEXTAUTH AUTHORIZE ERROR]:",
            error instanceof Error
              ? error.message
              : "Unknown error"
          );

          return null;
        }
      },
    }),
  ],

  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google" && user.email) {
        try {
          const cleanEmail = user.email
            .toLowerCase()
            .trim();

          const existingUser = await prisma.user.findUnique({
            where: {
              email: cleanEmail,
            },
          });

          if (!existingUser) {
            await prisma.user.create({
              data: {
                email: cleanEmail,
                name: user.name || "Google User",
                role: "user",
                plan: "free",
              },
            });
          }
        } catch (error: unknown) {
          console.error(
            "[NEXTAUTH GOOGLE SIGNIN DB ERROR]:",
            error instanceof Error
              ? error.message
              : "Unknown error"
          );
        }
      }

      return true;
    },

    async jwt({ token, user, account }) {
      // Credentials login supplies the database user.
      if (user && account?.provider === "credentials") {
        token.id = user.id;
        token.role = (user as any).role || "user";
        token.plan = (user as any).plan || "free";
      }

      // Resolve Google user's database record.
      if (
        account?.provider === "google" &&
        user?.email
      ) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: {
              email: user.email.toLowerCase().trim(),
            },
          });

          if (dbUser) {
            token.id = dbUser.id;
            token.role = dbUser.role || "user";
            token.plan = dbUser.plan || "free";
          }
        } catch (error) {
          console.error(
            "[NEXTAUTH JWT DB ERROR]:",
            error instanceof Error
              ? error.message
              : "Unknown error"
          );
        }
      }

      // Refresh database-backed role and plan for existing sessions.
      if (!user && token.email) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: {
              email: token.email.toLowerCase().trim(),
            },
          });

          if (dbUser) {
            token.id = dbUser.id;
            token.role = dbUser.role || "user";
            token.plan = dbUser.plan || "free";
          }
        } catch (error) {
          console.error(
            "[NEXTAUTH JWT REFRESH ERROR]:",
            error instanceof Error
              ? error.message
              : "Unknown error"
          );
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id =
          token.id || token.sub;

        (session.user as any).role =
          token.role || "user";

        (session.user as any).plan =
          token.plan || "free";
      }

      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
