import { prisma } from '@repo/db';
import type { Prisma, PrismaClient } from '@repo/db';
import type { User } from '@repo/shared/types';

// Transaction client type - works with both PrismaClient and transaction
type TxClient = Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>;

export async function findById(id: string, tx: TxClient = prisma): Promise<User | null> {
  return tx.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
      emailVerified: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function findByEmail(email: string, tx: TxClient = prisma): Promise<User | null> {
  return tx.user.findUnique({ where: { email } });
}

export async function findMany(
  params: {
    skip?: number;
    take?: number;
    where?: Prisma.UserWhereInput;
    orderBy?: Prisma.UserOrderByWithRelationInput;
  },
  tx: TxClient = prisma
): Promise<User[]> {
  const { skip, take, where, orderBy } = params;
  return tx.user.findMany({
    skip,
    take,
    where,
    orderBy,
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
      emailVerified: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function count(where?: Prisma.UserWhereInput, tx: TxClient = prisma): Promise<number> {
  return tx.user.count({ where });
}

export async function create(data: Prisma.UserCreateInput, tx: TxClient = prisma): Promise<User> {
  return tx.user.create({ data });
}

export async function update(id: string, data: Prisma.UserUpdateInput, tx: TxClient = prisma): Promise<User> {
  return tx.user.update({
    where: { id },
    data,
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
      emailVerified: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function deleteById(id: string, tx: TxClient = prisma): Promise<User> {
  return tx.user.delete({ where: { id } });
}
