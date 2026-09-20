import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env.js';
import { openapi } from './docs/openapi.js';
import { attachUser } from './middleware/auth.js';
import { errorHandler, notFoundHandler } from './middleware/error-handler.js';
import adminRoutes from './modules/admin/admin.routes.js';
import authRoutes from './modules/auth/auth.routes.js';
import importRoutes from './modules/import/import.routes.js';
import libraryRoutes from './modules/library/library.routes.js';
import playlistRoutes from './modules/playlists/playlists.routes.js';
import tmdbRoutes from './modules/tmdb/tmdb.routes.js';
import userRoutes from './modules/users/users.routes.js';

export function createApp() {
  const app = express();

  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true,
    }),
  );
  // Import bundles (whole libraries) are far bigger than any other request.
  const json = express.json({ limit: '100kb' });
  const importJson = express.json({ limit: '5mb' });
  app.use((req, res, next) => (req.path.startsWith('/api/import') ? importJson : json)(req, res, next));
  app.use(cookieParser());
  app.use(attachUser);

  app.get('/api/health', (_req, res) => res.json({ status: 'ok', uptime: process.uptime() }));

  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/library', libraryRoutes);
  app.use('/api/playlists', playlistRoutes);
  app.use('/api/import', importRoutes);
  app.use('/api/tmdb', tmdbRoutes);
  app.use('/api/admin', adminRoutes);

  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openapi));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
