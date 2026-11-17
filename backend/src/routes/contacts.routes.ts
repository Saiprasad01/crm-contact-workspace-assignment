import { Router } from 'express';
import { z } from 'zod';
import {
  getContactById,
  listContacts,
  updateContact,
} from '../services/contact.service';
import { addTagToContact, bulkAssignTag, removeTagFromContact } from '../services/tag.service';
import { listActivity } from '../services/activity.service';
import {
  bulkTagSchema,
  contactUpdateSchema,
  contactsQuerySchema,
  tagNameSchema,
} from '../validation/contact.schema';

export const contactsRouter = Router();

contactsRouter.get('/', async (req, res, next) => {
  try {
    const query = contactsQuerySchema.parse(req.query);
    const result = await listContacts(query);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// Declared before "/:id" so it isn't swallowed by the dynamic segment.
contactsRouter.post('/bulk/tags', async (req, res, next) => {
  try {
    const body = bulkTagSchema.parse(req.body);
    const result = await bulkAssignTag(body.contactIds, body.tagName);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

contactsRouter.get('/:id', async (req, res, next) => {
  try {
    const contact = await getContactById(req.params.id);
    res.json(contact);
  } catch (err) {
    next(err);
  }
});

contactsRouter.patch('/:id', async (req, res, next) => {
  try {
    const body = contactUpdateSchema.parse(req.body);
    const contact = await updateContact(req.params.id, body);
    res.json(contact);
  } catch (err) {
    next(err);
  }
});

contactsRouter.get('/:id/activity', async (req, res, next) => {
  try {
    const limit = z.coerce.number().int().min(1).max(100).optional().default(20).parse(
      req.query.limit
    );
    const activity = await listActivity(req.params.id, limit);
    res.json({ data: activity });
  } catch (err) {
    next(err);
  }
});

contactsRouter.post('/:id/tags', async (req, res, next) => {
  try {
    const body = tagNameSchema.parse(req.body);
    const tag = await addTagToContact(req.params.id, body.tagName);
    res.status(201).json(tag);
  } catch (err) {
    next(err);
  }
});

contactsRouter.delete('/:id/tags/:tagId', async (req, res, next) => {
  try {
    await removeTagFromContact(req.params.id, req.params.tagId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});
