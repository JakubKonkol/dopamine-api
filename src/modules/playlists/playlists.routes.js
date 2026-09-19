import { Router } from 'express';
import { z } from 'zod';
import { notFound } from '../../lib/errors.js';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { MEDIA_TYPES } from '../../models/user.model.js';

const router = Router();
router.use(requireAuth);

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid playlist id');
const playlistBody = z.object({
  name: z.string().trim().min(1, 'Name is required').max(60, 'Name is too long'),
  description: z.string().trim().max(300, 'Description is too long').optional().default(''),
});
const playlistPatch = playlistBody.partial();
const itemBody = z.object({
  mediaType: z.enum(MEDIA_TYPES),
  tmdbId: z.number().int().positive(),
});
const itemParams = z.object({
  id: objectId,
  mediaType: z.enum(MEDIA_TYPES),
  tmdbId: z.coerce.number().int().positive(),
});

function serialize(playlist) {
  return {
    id: playlist._id.toString(),
    name: playlist.name,
    description: playlist.description,
    items: [...playlist.items].sort((a, b) => b.addedAt - a.addedAt),
    createdAt: playlist.createdAt,
    updatedAt: playlist.updatedAt,
  };
}

function findPlaylist(user, id) {
  const playlist = user.playlists.id(id);
  if (!playlist) throw notFound('Playlist not found');
  return playlist;
}

router.get('/', (req, res) => {
  res.json({ playlists: req.user.playlists.map(serialize) });
});

router.post('/', validate({ body: playlistBody }), async (req, res) => {
  const playlist = req.user.playlists.create(req.input.body);
  req.user.playlists.push(playlist);
  await req.user.save();
  res.status(201).json({ playlist: serialize(playlist) });
});

router.get('/:id', validate({ params: z.object({ id: objectId }) }), (req, res) => {
  res.json({ playlist: serialize(findPlaylist(req.user, req.input.params.id)) });
});

router.patch('/:id', validate({ params: z.object({ id: objectId }), body: playlistPatch }), async (req, res) => {
  const playlist = findPlaylist(req.user, req.input.params.id);
  playlist.set(req.input.body);
  await req.user.save();
  res.json({ playlist: serialize(playlist) });
});

router.delete('/:id', validate({ params: z.object({ id: objectId }) }), async (req, res) => {
  findPlaylist(req.user, req.input.params.id).deleteOne();
  await req.user.save();
  res.status(204).end();
});

router.post('/:id/items', validate({ params: z.object({ id: objectId }), body: itemBody }), async (req, res) => {
  const playlist = findPlaylist(req.user, req.input.params.id);
  const { mediaType, tmdbId } = req.input.body;

  if (!playlist.items.some((i) => i.mediaType === mediaType && i.tmdbId === tmdbId)) {
    playlist.items.push({ mediaType, tmdbId });
    await req.user.save();
  }
  res.json({ playlist: serialize(playlist) });
});

router.delete('/:id/items/:mediaType/:tmdbId', validate({ params: itemParams }), async (req, res) => {
  const { id, mediaType, tmdbId } = req.input.params;
  const playlist = findPlaylist(req.user, id);

  playlist.items = playlist.items.filter((i) => !(i.mediaType === mediaType && i.tmdbId === tmdbId));
  await req.user.save();
  res.json({ playlist: serialize(playlist) });
});

export default router;
