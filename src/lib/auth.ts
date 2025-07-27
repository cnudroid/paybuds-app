import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { prisma } from './prisma'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    signIn: async ({ user, account, profile }) => {
      // Handle user merging for OAuth sign-ins
      if (account?.provider === 'google' && user.email) {
        try {
          // Check if there's a placeholder user with this email
          const existingPlaceholderUser = await prisma.user.findFirst({
            where: {
              email: user.email,
              isPlaceholder: true,
            },
            include: {
              groupMemberships: true,
              paidExpenses: true,
              expenseSplits: true,
              paidSettlements: true,
              receivedSettlements: true,
            },
          });

          if (existingPlaceholderUser) {
            // Merge the placeholder user data with the OAuth user
            await prisma.$transaction(async (tx) => {
              // Update all group memberships
              await tx.groupMember.updateMany({
                where: { userId: existingPlaceholderUser.id },
                data: { userId: user.id },
              });

              // Update all expenses where this user was the payer
              await tx.expense.updateMany({
                where: { payerId: existingPlaceholderUser.id },
                data: { payerId: user.id },
              });

              // Update all expense splits
              await tx.expenseSplit.updateMany({
                where: { userId: existingPlaceholderUser.id },
                data: { userId: user.id },
              });

              // Update settlements where this user was payer
              await tx.settlement.updateMany({
                where: { payerId: existingPlaceholderUser.id },
                data: { payerId: user.id },
              });

              // Update settlements where this user was receiver
              await tx.settlement.updateMany({
                where: { receiverId: existingPlaceholderUser.id },
                data: { receiverId: user.id },
              });

              // Update any pending invitations
              await tx.groupInvitation.updateMany({
                where: { acceptedById: existingPlaceholderUser.id },
                data: { acceptedById: user.id },
              });

              // Delete the placeholder user
              await tx.user.delete({
                where: { id: existingPlaceholderUser.id },
              });
            });

            console.log(`Merged placeholder user ${existingPlaceholderUser.id} with OAuth user ${user.id}`);
          }
        } catch (error) {
          console.error('Error during user merging:', error);
          // Don't block sign-in if merging fails
        }
      }
      
      return true;
    },
    session: async ({ session, token }) => {
      if (session?.user && token?.sub) {
        session.user.id = token.sub
      }
      return session
    },
    jwt: async ({ user, token }) => {
      if (user) {
        token.uid = user.id
      }
      return token
    },
  },
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
}
