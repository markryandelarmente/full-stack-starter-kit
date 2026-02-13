import type { Request, Response } from 'express';
import { userService } from '../services';

export async function list(req: Request, res: Response) {
  const pagination = req.validated?.query as { page: number; pageSize: number };
  const result = await userService.list(pagination);
  res.json({ success: true, data: result });
}

export async function me(req: Request, res: Response) {
  const user = await userService.getById(req.user!.id);
  res.json({ success: true, data: user });
}

export async function getById(req: Request<{ id: string }>, res: Response) {
  const user = await userService.getById(req.params.id);
  res.json({ success: true, data: user });
}

export async function update(req: Request, res: Response) {
  const user = await userService.update(req.user!.id, req.body);
  res.json({ success: true, data: user });
}

export async function deleteById(req: Request<{ id: string }>, res: Response) {
  await userService.deleteById(req.params.id);
  res.json({ success: true, data: null });
}
