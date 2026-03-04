import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | null | undefined;
};

// Env var names to check, in priority order
const DB_URL_ENV_VARS = [
  "POSTGRES_PRISMA_URL",
  "POSTGRES_URL_NON_POOLING",
  "DATABASE_URL",
  "POSTGRES_URL",
] as const;

function createPrismaClient(): PrismaClient | null {
  let foundVar: string | undefined;
  let databaseUrl: string | undefined;

  for (const envVar of DB_URL_ENV_VARS) {
    if (process.env[envVar]) {
      foundVar = envVar;
      databaseUrl = process.env[envVar];
      break;
    }
  }

  if (!databaseUrl || !foundVar) {
    console.warn(
      `Prisma: No database URL found. Checked: ${DB_URL_ENV_VARS.join(", ")}`
    );
    return null;
  }

  console.log(`Prisma: Using database URL from ${foundVar}`);

  // Bridge to the env var that Prisma schema expects (env("POSTGRES_PRISMA_URL"))
  if (foundVar !== "POSTGRES_PRISMA_URL") {
    process.env.POSTGRES_PRISMA_URL = databaseUrl;
  }

  try {
    return new PrismaClient();
  } catch (error) {
    console.error("Failed to create Prisma client:", error);
    return null;
  }
}

// Lazy initialization - only create when a database URL is available
export function getPrisma(): PrismaClient | null {
  if (globalForPrisma.prisma !== undefined) {
    return globalForPrisma.prisma;
  }

  const client = createPrismaClient();
  globalForPrisma.prisma = client;
  return client;
}
