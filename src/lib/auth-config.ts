import { AuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcrypt"
import { logActivity } from "@/lib/activity-logger"

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        identifier: { label: "Email or Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials, req) {
        if (!credentials?.identifier || !credentials?.password) {
          return null
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
            include: {
              company: true
            }
          })

          if (!user) {
            return null
          }

          // Check if user is verified
          if (!user.verified) {
            return null
          }

          // Check password
          const passwordMatch = await bcrypt.compare(credentials.password, user.password)

          if (!passwordMatch) {
            return null
          }

          // Log successful login activity
          try {
            await logActivity({
              userId: user.id,
              action: 'LOGIN',
              resourceType: 'AUTHENTICATION',
              resourceTitle: `User login: ${user.firstName} ${user.lastName}`,
              metadata: {
                identifier: credentials.identifier,
                loginMethod: 'nextauth',
                companyId: user.companyId,
                companyName: user.company.name
              },
              ipAddress: req?.headers?.['x-forwarded-for'] as string || req?.headers?.['x-real-ip'] as string || 'unknown',
              userAgent: req?.headers?.['user-agent'] || 'unknown'
            })
          } catch (error) {
            console.error('Error logging activity:', error)
          }

          return {
            id: user.id,
            email: user.email,
            name: `${user.firstName} ${user.lastName}`,
            firstName: user.firstName,
            lastName: user.lastName,
            username: user.username,
            companyId: user.companyId,
            companyName: user.company.name
          }
        } catch (error) {
          console.error('Auth error:', error)
          return null
        }
      }
    })
  ],
  session: {
    strategy: "jwt" as const,
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  jwt: {
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.firstName = user.firstName
        token.lastName = user.lastName
        token.username = user.username
        token.companyId = user.companyId
        token.companyName = user.companyName
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.firstName = token.firstName as string
        session.user.lastName = token.lastName as string
        session.user.username = token.username as string
        session.user.companyId = token.companyId as string
        session.user.companyName = token.companyName as string
      }
      return session
    }
  },
  pages: {
    signIn: '/signin',
    error: '/signin',
  },
  secret: process.env.NEXTAUTH_SECRET,
} 