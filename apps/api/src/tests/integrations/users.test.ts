import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { usersRouter } from '../../routes/users';
import { errorHandler } from '../../middleware/error-handler';
import { createTestUser, createTestUsers, prisma } from '../helpers';

// Mock auth middleware for testing - inject real user from DB
let mockUserId = 'user-123';

vi.mock('../../middleware/auth', () => ({
  requireAuth: vi.fn((req, _res, next) => {
    req.user = { id: mockUserId, email: 'test@example.com', name: 'Test User', emailVerified: true };
    next();
  }),
  optionalAuth: vi.fn((_req, _res, next) => next()),
}));

// Create test app
function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/users', usersRouter);
  app.use(errorHandler);
  return app;
}

describe('Integration Test for users API routes', () => {
  let app: express.Express;

  beforeEach(() => {
    app = createTestApp();
  });

  describe('GET /api/users', () => {
    describe('Success Scenario', () => {
      it('returns paginated users list', async () => {
        await createTestUsers(5);

        const response = await request(app)
          .get('/api/users')
          .query({ page: 1, pageSize: 10 });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.items).toHaveLength(5);
        expect(response.body.data.total).toBe(5);
      });

      it('returns paginated users with custom pagination', async () => {
        await createTestUsers(10);

        const response = await request(app)
          .get('/api/users')
          .query({ page: 2, pageSize: 3 });

        expect(response.status).toBe(200);
        expect(response.body.data.items).toHaveLength(3);
        expect(response.body.data.page).toBe(2);
        expect(response.body.data.pageSize).toBe(3);
        expect(response.body.data.totalPages).toBe(4);
      });
    });

    describe('Edge Case Scenario', () => {
      it('returns empty list when no users exist', async () => {
        const response = await request(app)
          .get('/api/users')
          .query({ page: 1, pageSize: 10 });

        expect(response.status).toBe(200);
        expect(response.body.data.items).toEqual([]);
        expect(response.body.data.total).toBe(0);
      });
    });
  });

  describe('GET /api/users/me', () => {
    describe('Success Scenario', () => {
      it('returns current authenticated user', async () => {
        const user = await createTestUser({ id: 'auth-user-123' });
        mockUserId = user.id;

        const response = await request(app).get('/api/users/me');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.id).toBe(user.id);
        expect(response.body.data.email).toBe(user.email);
      });
    });

    describe('Error Scenario', () => {
      it('returns 404 when user not found', async () => {
        mockUserId = 'non-existent-user';

        const response = await request(app).get('/api/users/me');

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('NOT_FOUND');
      });
    });
  });

  describe('GET /api/users/:id', () => {
    describe('Success Scenario', () => {
      it('returns user by id', async () => {
        const user = await createTestUser();

        const response = await request(app).get(`/api/users/${user.id}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.id).toBe(user.id);
      });
    });

    describe('Error Scenario', () => {
      it('returns 404 when user not found', async () => {
        const response = await request(app).get('/api/users/non-existent');

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('NOT_FOUND');
      });
    });
  });

  describe('PATCH /api/users/me', () => {
    describe('Success Scenario', () => {
      it('updates current user profile', async () => {
        const user = await createTestUser({ name: 'Original Name' });
        mockUserId = user.id;

        const response = await request(app)
          .patch('/api/users/me')
          .send({ name: 'Updated Name' });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.name).toBe('Updated Name');

        // Verify in database
        const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
        expect(dbUser?.name).toBe('Updated Name');
      });

      it('updates user image', async () => {
        const user = await createTestUser();
        mockUserId = user.id;

        const response = await request(app)
          .patch('/api/users/me')
          .send({ image: 'https://new-image.com/avatar.jpg' });

        expect(response.status).toBe(200);
        expect(response.body.data.image).toBe('https://new-image.com/avatar.jpg');
      });
    });

    describe('Error Scenario', () => {
      it('returns 404 when user not found', async () => {
        mockUserId = 'non-existent-user';

        const response = await request(app)
          .patch('/api/users/me')
          .send({ name: 'New Name' });

        expect(response.status).toBe(404);
      });
    });
  });

  describe('DELETE /api/users/:id', () => {
    describe('Success Scenario', () => {
      it('deletes user by id', async () => {
        const user = await createTestUser();

        const response = await request(app).delete(`/api/users/${user.id}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeNull();

        // Verify deleted from database
        const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
        expect(dbUser).toBeNull();
      });
    });

    describe('Error Scenario', () => {
      it('returns 404 when user not found', async () => {
        const response = await request(app).delete('/api/users/non-existent');

        expect(response.status).toBe(404);
        expect(response.body.error.code).toBe('NOT_FOUND');
      });
    });
  });
});
