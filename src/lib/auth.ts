import { getServerSession as getNextAuthSession } from 'next-auth';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

export const config: NextAuthOptions = {
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
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email,
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
            company: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        });

        if (!user) {
          return null;
        }

        const passwordMatch = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!passwordMatch) {
          return null;
        }

        // Debug log
        console.log("Auth user data:", {
          id: user.id,
          email: user.email,
          privilege: user.privilege,
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
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        return {
          ...token,
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          companyId: user.companyId,
          companyName: user.companyName,
          privilege: user.privilege,
        };
      }
      return token;
    },
    async session({ session, token }) {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.id,
          firstName: token.firstName,
          lastName: token.lastName,
          companyId: token.companyId,
          companyName: token.companyName,
          privilege: token.privilege,
        },
      };
    },
  },
};

export async function getServerSession() {
  try {
    const session = await getNextAuthSession(config);
    return session;
  } catch (error) {
    console.error('Error in getServerSession:', error);
    return null;
  }
}

export async function getAuthenticatedUser() {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return null;
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { 
        id: true, 
        firstName: true, 
        lastName: true,
        email: true,
        username: true,
        companyId: true
      }
    });

    return user;
  } catch (error) {
    console.error('Error getting authenticated user:', error);
    return null;
  }
}

// Helper function to check if a user is authenticated for API routes
export async function requireAuth(request?: NextRequest) {
  try {
    // For API routes, we need to get the session differently
    const session = await getNextAuthSession(config);
    if (!session?.user?.id) {
      return {
        error: { success: false, message: 'Authentication required' },
        status: 401
      };
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { 
        id: true, 
        firstName: true, 
        lastName: true,
        email: true,
        username: true,
        companyId: true
      }
    });

    if (!user) {
      return {
        error: { success: false, message: 'User not found' },
        status: 401
      };
    }

    return { user };
  } catch (error) {
    console.error('Error in requireAuth:', error);
    return {
      error: { success: false, message: 'Authentication failed' },
      status: 500
    };
  }
} 