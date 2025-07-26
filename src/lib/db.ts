<<<<<<< HEAD
import { PrismaClient } from '@prisma/client/edge';
=======
import { PrismaClient } from '@prisma/client';
>>>>>>> 5974cbd182ca71257d14819d61af882d9e13c4d4

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
declare global {
  // eslint-disable-next-line no-var, no-unused-vars
  var prisma: PrismaClient | undefined;
}

<<<<<<< HEAD
let db: PrismaClient;

if (!global.prisma) {
  db = new PrismaClient({ log: ['query'] });
  if (process.env.NODE_ENV !== 'production') global.prisma = db;
} else {
  db = global.prisma;
}

export { db };

=======
// Create a single PrismaClient instance for the entire application
export const db = global.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'error', 'warn'] 
    : ['error'],
});

// Only set the global instance in development
if (process.env.NODE_ENV !== 'production') {
  global.prisma = db;
}

// Export the Prisma types for use in the application
export * from '@prisma/client';
>>>>>>> 5974cbd182ca71257d14819d61af882d9e13c4d4
