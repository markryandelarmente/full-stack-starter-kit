import { type Router as RouterType, Router } from 'express';
import { usersRouter } from './users';
import { filesRouter } from './files';

export const apiRouter: RouterType = Router();

apiRouter.use('/users', usersRouter);
apiRouter.use('/files', filesRouter);

// Add more route modules here
// apiRouter.use('/posts', postsRouter);
