import { PrismaClient } from '@prisma/client';

let db: PrismaClient;

declare global {
  var __db: PrismaClient | undefined;
}

if (process.env.NODE_ENV === 'production') {
  db = new PrismaClient();
} else {
  if (!global.__db) {
    global.__db = new PrismaClient();
  }
  db = global.__db;
}

export { db };

export interface Role {
  id: string;
  name: string;
  code: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export async function getRoles(): Promise<Role[]> {
  return db.role.findMany({
    orderBy: { createdAt: 'desc' }
  });
}

export async function createRole(data: Omit<Role, 'id' | 'createdAt' | 'updatedAt'>): Promise<Role> {
  return db.role.create({
    data
  });
}

export async function getRoleByCode(code: string): Promise<Role | null> {
  return db.role.findUnique({
    where: { code }
  });
} 