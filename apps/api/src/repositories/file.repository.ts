import { prisma } from '@repo/db';
import type { Prisma, PrismaClient } from '@repo/db';
import type { File } from '@repo/shared/types';

// Transaction client type - works with both PrismaClient and transaction
type TxClient = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

export async function create(data: Prisma.FileCreateInput, tx: TxClient = prisma): Promise<File> {
  return tx.file.create({ data });
}

export async function findById(id: string, tx: TxClient = prisma): Promise<File | null> {
  return (
    tx as unknown as {
      file: { findUnique: (args: { where: { id: string } }) => Promise<File | null> };
    }
  ).file.findUnique({ where: { id } });
}

export async function findByEntity(
  entityType: string,
  entityId: string,
  tx: TxClient = prisma
): Promise<File[]> {
  return tx.file.findMany({
    where: {
      entityType,
      entityId,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

export async function deleteById(id: string, tx: TxClient = prisma): Promise<File> {
  return tx.file.delete({ where: { id } });
}

export async function deleteByEntity(
  entityType: string,
  entityId: string,
  tx: TxClient = prisma
): Promise<Prisma.BatchPayload> {
  return tx.file.deleteMany({
    where: {
      entityType,
      entityId,
    },
  });
}

export async function countByEntity(
  entityType: string,
  entityId: string,
  tx: TxClient = prisma
): Promise<number> {
  return tx.file.count({
    where: {
      entityType,
      entityId,
    },
  });
}

export async function update(
  id: string,
  data: Prisma.FileUpdateInput,
  tx: TxClient = prisma
): Promise<File> {
  return tx.file.update({
    where: { id },
    data,
  });
}
