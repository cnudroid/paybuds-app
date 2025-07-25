import { PrismaClient } from '@prisma/client/edge';
import { withAccelerate } from '@prisma/extension-accelerate';

declare global {
  // allow global `var` declarations
  // eslint-disable-next-line no-unused-vars
  var prisma: PrismaClient | undefined;
}

export const db =
  global.prisma ||
  new PrismaClient({
    log: ['query'],
  }).$extends(withAccelerate());

if (process.env.NODE_ENV !== 'production') global.prisma = db;
