import cors from 'cors';
import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { loadOpenApiDocument } from './docs';
import { errorHandler } from './middleware/errorHandler';
import { contactsRouter } from './routes/contacts.routes';
import { tagsRouter } from './routes/tags.routes';

export function createApp() {
  const app = express();

  app.use(cors({ origin: process.env.CORS_ORIGIN ?? '*' }));
  app.use(express.json());

  app.get('/health', (_req, res) => res.json({ status: 'ok' }));

  // Interactive API docs generated from openapi.yaml — http://localhost:4000/api-docs
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(loadOpenApiDocument()));
  app.get('/openapi.json', (_req, res) => res.json(loadOpenApiDocument()));

  app.use('/api/v1/contacts', contactsRouter);
  app.use('/api/v1/tags', tagsRouter);

  app.use(errorHandler);

  return app;
}
