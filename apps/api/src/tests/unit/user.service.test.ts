import { describe, it, expect } from 'vitest';
import * as userService from '../../services/user.service';
import { createTestUser, createTestUsers, prisma } from '../helpers';
import { ApiError } from '../../lib/errors';

describe('Unit Test for userService', () => {
  describe('getById', () => {
    describe('Success Scenario', () => {
      it('returns user when user exists', async () => {
        const createdUser = await createTestUser();

        const result = await userService.getById(createdUser.id);

        expect(result).toMatchObject({
          id: createdUser.id,
          email: createdUser.email,
          name: createdUser.name,
        });
      });
    });

    describe('Error Scenario', () => {
      it('throws NOT_FOUND error when user does not exist', async () => {
        await expect(userService.getById('non-existent-id')).rejects.toThrow(ApiError);
        await expect(userService.getById('non-existent-id')).rejects.toThrow('User not found');
      });
    });
  });

  describe('getByEmail', () => {
    describe('Success Scenario', () => {
      it('returns user when user exists', async () => {
        const createdUser = await createTestUser({ email: 'findme@example.com' });

        const result = await userService.getByEmail('findme@example.com');

        expect(result).toMatchObject({
          id: createdUser.id,
          email: 'findme@example.com',
        });
      });

      it('returns null when user does not exist', async () => {
        const result = await userService.getByEmail('nonexistent@example.com');

        expect(result).toBeNull();
      });
    });
  });

  describe('list', () => {
    describe('Success Scenario', () => {
      it('returns paginated users list', async () => {
        await createTestUsers(5);

        const result = await userService.list({ page: 1, pageSize: 2 });

        expect(result.items).toHaveLength(2);
        expect(result.total).toBe(5);
        expect(result.page).toBe(1);
        expect(result.pageSize).toBe(2);
        expect(result.totalPages).toBe(3);
      });

      it('returns correct page for page 2', async () => {
        await createTestUsers(5);

        const page1 = await userService.list({ page: 1, pageSize: 2 });
        const page2 = await userService.list({ page: 2, pageSize: 2 });

        expect(page1.items).toHaveLength(2);
        expect(page2.items).toHaveLength(2);
        // Ensure different users on different pages
        expect(page1.items[0]?.id).not.toBe(page2.items[0]?.id);
      });

      it('calculates correct total pages with partial last page', async () => {
        await createTestUsers(7);

        const result = await userService.list({ page: 1, pageSize: 3 });

        expect(result.totalPages).toBe(3); // 7 / 3 = 2.33, ceil = 3
      });
    });

    describe('Edge Case Scenario', () => {
      it('returns empty list when no users exist', async () => {
        const result = await userService.list({ page: 1, pageSize: 10 });

        expect(result).toEqual({
          items: [],
          total: 0,
          page: 1,
          pageSize: 10,
          totalPages: 0,
        });
      });
    });
  });

  describe('update', () => {
    describe('Success Scenario', () => {
      it('updates and returns user when user exists', async () => {
        const createdUser = await createTestUser({ name: 'Original Name' });

        const result = await userService.update(createdUser.id, { name: 'Updated Name' });

        expect(result.name).toBe('Updated Name');
        expect(result.id).toBe(createdUser.id);

        // Verify in database
        const dbUser = await prisma.user.findUnique({ where: { id: createdUser.id } });
        expect(dbUser?.name).toBe('Updated Name');
      });

      it('updates user image', async () => {
        const createdUser = await createTestUser();

        const result = await userService.update(createdUser.id, { image: 'https://new-image.com/avatar.jpg' });

        expect(result.image).toBe('https://new-image.com/avatar.jpg');
      });
    });

    describe('Error Scenario', () => {
      it('throws NOT_FOUND error when user does not exist', async () => {
        await expect(userService.update('non-existent-id', { name: 'Test' })).rejects.toThrow(
          'User not found'
        );
      });
    });
  });

  describe('deleteById', () => {
    describe('Success Scenario', () => {
      it('deletes user when user exists', async () => {
        const createdUser = await createTestUser();

        await userService.deleteById(createdUser.id);

        // Verify deleted from database
        const dbUser = await prisma.user.findUnique({ where: { id: createdUser.id } });
        expect(dbUser).toBeNull();
      });
    });

    describe('Error Scenario', () => {
      it('throws NOT_FOUND error when user does not exist', async () => {
        await expect(userService.deleteById('non-existent-id')).rejects.toThrow('User not found');
      });
    });
  });
});
