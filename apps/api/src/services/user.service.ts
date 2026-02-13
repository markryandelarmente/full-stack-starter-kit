import { userRepository } from '../repositories';
import { ApiError } from '../lib/errors';

export async function getById(id: string) {
  const user = await userRepository.findById(id);
  if (!user) {
    throw ApiError.notFound('User not found');
  }
  return user;
}

export async function getByEmail(email: string) {
  return userRepository.findByEmail(email);
}

export async function list(pagination: { page: number; pageSize: number }) {
  const { page, pageSize } = pagination;
  const skip = (page - 1) * pageSize;

  const [users, total] = await Promise.all([
    userRepository.findMany({ skip, take: pageSize }),
    userRepository.count(),
  ]);

  return {
    items: users,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function update(id: string, data: { name?: string; image?: string }) {
  await getById(id); // Verify exists
  return userRepository.update(id, data);
}

export async function deleteById(id: string) {
  await getById(id); // Verify exists
  return userRepository.deleteById(id);
}
