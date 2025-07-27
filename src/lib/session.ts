import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import type { User as PrismaUser } from "@prisma/client";

export async function getSession() {
  return await getServerSession(authOptions);
}

export async function getCurrentUser(): Promise<PrismaUser | undefined> {
  const session = await getSession();
  console.log('getCurrentUser: NODE_ENV =', process.env.NODE_ENV);
  console.log('getCurrentUser: session =', session ? 'found' : 'not found');

  if (process.env.NODE_ENV === "development") {
    // In development, if a real session exists, use it. Otherwise, use/create the mock user.
    if (session?.user) {
      return session.user as PrismaUser;
    }

    const mockUserId = "cl9ebjaco000008jlbfd21hpr";
    let mockUser = await db.user.findUnique({
      where: { id: mockUserId },
    });

    if (!mockUser) {
      mockUser = await db.user.create({
        data: {
          id: mockUserId,
          name: "Mock User",
          email: "mock@user.com",
          image: `https://i.pravatar.cc/150?u=${mockUserId}`,
        },
      });
    }
    return mockUser;
  }

  if (!session?.user) {
    console.log('getCurrentUser: No session user in production');
    return undefined;
  }

  console.log('getCurrentUser: Found session user in production');
  return session.user as PrismaUser;
}
