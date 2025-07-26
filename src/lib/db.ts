import { PrismaClient } from '@prisma/client/edge';

declare global {
  // allow global `var` declarations
  // eslint-disable-next-line no-unused-vars
  var prisma: PrismaClient | undefined;
}

let db: PrismaClient;

if (!global.prisma) {
  db = new PrismaClient({ log: ['query'] });
  if (process.env.NODE_ENV !== 'production') global.prisma = db;
} else {
  db = global.prisma;
}

export { db };

