// FILE: lib/prisma.ts (Please ensure this is the exact content)
import { PrismaClient } from '@prisma/client'

// Prefer the Accelerate URL when available; fall back to the direct DB URL.
const datasourceUrl =
  process.env.PRISMA_DATABASE_URL ?? process.env.DATABASE_URL;

const prismaClientSingleton = () => {
  return new PrismaClient({
    datasources: { db: { url: datasourceUrl } },
  });
}

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prisma ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma;
