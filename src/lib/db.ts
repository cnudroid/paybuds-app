import { PrismaClient } from '@prisma/client/edge';

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
declare global {
  // eslint-disable-next-line no-var, no-unused-vars
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

