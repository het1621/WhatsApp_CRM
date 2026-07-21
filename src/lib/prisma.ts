// src/lib/prisma.ts
// Shared PrismaClient singleton
// Prisma recommends a single instance per application to avoid connection pool exhaustion

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default prisma;
