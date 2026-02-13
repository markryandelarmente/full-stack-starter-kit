import { prisma } from '../setup';
import { createUserFixture } from '../fixtures';

/**
 * Create a user in the test database
 * If user with same ID exists, returns it. Otherwise creates a new one.
 * Ensures email is unique by using ID-based email if not provided.
 */
export async function createTestUser(overrides: Parameters<typeof createUserFixture>[0] = {}) {
  const userData = createUserFixture(overrides);

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({ where: { id: userData.id } });
  if (existingUser) {
    return existingUser;
  }

  // Use ID-based email if email wasn't explicitly provided to ensure uniqueness
  const email = overrides.email || `${userData.id}@test.example.com`;

  return await prisma.user.create({
    data: {
      id: userData.id,
      email,
      name: userData.name,
      image: userData.image,
      emailVerified: userData.emailVerified,
    },
  });
}

/**
 * Create multiple users in the test database
 */
export async function createTestUsers(count: number) {
  const users = [];
  for (let i = 0; i < count; i++) {
    users.push(await createTestUser());
  }
  return users;
}

/**
 * Get user count from test database
 */
export async function getUserCount() {
  return prisma.user.count();
}

export { prisma };
