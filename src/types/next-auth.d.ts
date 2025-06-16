import NextAuth from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      firstName: string
      lastName: string
      username: string
      companyId: string
      companyName: string
      privilege: string
    }
  }

  interface User {
    id: string
    email: string
    name: string
    firstName: string
    lastName: string
    username: string
    companyId: string
    companyName: string
    privilege: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    firstName: string
    lastName: string
    username: string
    companyId: string
    companyName: string
    privilege: string
  }
} 