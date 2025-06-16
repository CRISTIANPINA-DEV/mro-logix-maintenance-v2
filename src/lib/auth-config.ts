import { AuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcrypt"
import { logActivity } from "@/lib/activity-logger"

export const authOptions: AuthOptions = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/signin",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        identifier: { label: "Email or Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials, req) {
        if (!credentials?.identifier || !credentials?.password) {
          return null;
        }

        try {
          // Find user by email or username with company information
          const user = await prisma.user.findFirst({
            where: {
              OR: [
                { email: credentials.identifier },
                { username: credentials.identifier }
              ]
            },
            select: {
              id: true,
              email: true,
              password: true,
              firstName: true,
              lastName: true,
              username: true,
              companyId: true,
              privilege: true,
              verified: true,
              company: {
                select: {
                  id: true,
                  name: true,
                }
              }
            }
          });

          if (!user) {
            return null;
          }

          // Check if user is verified
          if (!user.verified) {
            return null;
          }

          // Check password
          const passwordMatch = await bcrypt.compare(credentials.password, user.password)

          if (!passwordMatch) {
            return null;
          }

          // Debug log
          console.log("Auth - User data:", {
            id: user.id,
            email: user.email,
            privilege: user.privilege,
          });

          // Log successful login
          await logActivity({
            userId: user.id,
            action: "LOGIN",
            ipAddress: req.headers?.["x-forwarded-for"] as string || "unknown",
            userAgent: req.headers?.["user-agent"] || "unknown"
          });

          return {
            id: user.id,
            email: user.email,
            name: `${user.firstName} ${user.lastName}`,
            firstName: user.firstName,
            lastName: user.lastName,
            username: user.username,
            companyId: user.companyId,
            companyName: user.company.name,
            privilege: user.privilege,
          };
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
        token.username = user.username;
        token.companyId = user.companyId;
        token.companyName = user.companyName;
        token.privilege = user.privilege;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.firstName = token.firstName as string;
        session.user.lastName = token.lastName as string;
        session.user.username = token.username as string;
        session.user.companyId = token.companyId as string;
        session.user.companyName = token.companyName as string;
        session.user.privilege = token.privilege as string;
      }
      return session;
    }
  },
} 