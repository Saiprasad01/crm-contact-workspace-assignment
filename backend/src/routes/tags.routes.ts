import { Router } from 'express';
import { listTags } from '../services/tag.service';

export const tagsRouter = Router();

tagsRouter.get('/', async (_req, res, next) => {
  try {
    const tags = await listTags();
    res.json({ data: tags });
  } catch (err) {
    next(err);
  }
});
