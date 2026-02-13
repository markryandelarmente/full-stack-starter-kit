import { type Router as RouterType, Router } from 'express';
import { userController } from '../controllers';
import { requireAuth } from '../middleware/auth';
import { validate } from '../lib/validate';
import { updateUserSchema, paginationSchema } from '@repo/shared/validators';

export const usersRouter: RouterType = Router();

// GET /api/users - List users (paginated)
usersRouter.get('/', requireAuth, validate(paginationSchema, 'query'), userController.list);

// GET /api/users/me - Get current user
usersRouter.get('/me', requireAuth, userController.me);

// GET /api/users/:id - Get user by ID
usersRouter.get('/:id', requireAuth, userController.getById);

// PATCH /api/users/me - Update current user
usersRouter.patch('/me', requireAuth, validate(updateUserSchema, 'body'), userController.update);

// DELETE /api/users/:id - Delete user
usersRouter.delete('/:id', requireAuth, userController.deleteById);
