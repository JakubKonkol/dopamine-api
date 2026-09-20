import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { MEDIA_TYPES } from '../../models/user.model.js';
import { serializeLibrary } from '../library/library.controller.js';
import { importBundle } from './import.service.js';

const router = Router();
router.use(requireAuth);

const MAX_ITEMS = 5000;

/** One title to import: a TMDB id, or a TVDB id that the server resolves. */
const importItem = z
  .object({
    mediaType: z.enum(MEDIA_TYPES),
    tmdbId: z.number().int().positive().optional(),
    tvdbId: z.number().int().positive().optional(),
    title: z.string().trim().max(300).optional(),
    addedAt: z.coerce.date().optional(),
  })
  .refine((v) => v.tmdbId !== undefined || v.tvdbId !== undefined, { message: 'tmdbId or tvdbId is required' });

const bundleSchema = z
  .object({
    watchlist: z.array(importItem).max(MAX_ITEMS).default([]),
    history: z.array(importItem).max(MAX_ITEMS).default([]),
    playlists: z
      .array(
        z.object({
          name: z.string().trim().min(1, 'Playlist name is required').max(60, 'Playlist name is too long'),
          description: z.string().trim().max(300).optional().default(''),
          items: z.array(importItem).max(MAX_ITEMS).default([]),
        }),
      )
      .max(100)
      .default([]),
  })
  .refine((b) => b.watchlist.length + b.history.length + b.playlists.length > 0, {
    message: 'Nothing to import',
  });

router.post('/', validate({ body: bundleSchema }), async (req, res) => {
  const summary = await importBundle(req.user, req.input.body);
  res.json({ ...summary, library: serializeLibrary(req.user) });
});

export default router;
