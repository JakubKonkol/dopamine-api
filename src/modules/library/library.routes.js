import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { MEDIA_TYPES } from '../../models/user.model.js';
import * as controller from './library.controller.js';

const router = Router();
router.use(requireAuth);

const listParam = z.enum(['watchlist', 'history']);
const mediaRefParams = z.object({
  list: listParam,
  mediaType: z.enum(MEDIA_TYPES),
  tmdbId: z.coerce.number().int().positive(),
});

router.get('/', controller.getLibrary);
router.get('/stats', controller.getStats);
router.put('/:list/:mediaType/:tmdbId', validate({ params: mediaRefParams }), controller.addToList);
router.delete('/:list/:mediaType/:tmdbId', validate({ params: mediaRefParams }), controller.removeFromList);

export default router;
