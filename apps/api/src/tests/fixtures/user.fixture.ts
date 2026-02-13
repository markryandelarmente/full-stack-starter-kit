import { faker } from '@faker-js/faker';

export interface UserFixture {
  id: string;
  email: string;
  name: string;
  image: string | null;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserListItemFixture {
  id: string;
  email: string;
  name: string;
  image: string | null;
  createdAt: Date;
}

/**
 * Create a random user fixture with optional overrides
 */
export function createUserFixture(overrides: Partial<UserFixture> = {}): UserFixture {
  return {
    id: faker.string.uuid(),
    email: faker.internet.email(),
    name: faker.person.fullName(),
    image: faker.image.avatar(),
    emailVerified: faker.datatype.boolean(),
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent(),
    ...overrides,
  };
}

/**
 * Create a random user list item fixture with optional overrides
 */
export function createUserListItemFixture(overrides: Partial<UserListItemFixture> = {}): UserListItemFixture {
  return {
    id: faker.string.uuid(),
    email: faker.internet.email(),
    name: faker.person.fullName(),
    image: faker.image.avatar(),
    createdAt: faker.date.past(),
    ...overrides,
  };
}

/**
 * Create multiple user list item fixtures
 */
export function createUserListFixture(count = 2): UserListItemFixture[] {
  return Array.from({ length: count }, () => createUserListItemFixture());
}
