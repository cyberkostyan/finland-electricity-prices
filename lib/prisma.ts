import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | null | undefined;
};

function createPrismaClient(): PrismaClient | null {
  const databaseUrl = process.env.POSTGRES_PRISMA_URL || process.env.POSTGRES_URL_NON_POOLING;

  if (!databaseUrl) {
    return null;
  }

  try {
    return new PrismaClient();
  } catch (error) {
    console.error("Failed to create Prisma client:", error);
    return null;
  }
}

// Lazy initialization - only create when POSTGRES_PRISMA_URL is available
export function getPrisma(): PrismaClient | null {
  if (globalForPrisma.prisma !== undefined) {
    return globalForPrisma.prisma;
  }

  const client = createPrismaClient();
  globalForPrisma.prisma = client;
  return client;
}
