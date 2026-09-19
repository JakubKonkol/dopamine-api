import { Router } from 'express';
import { z } from 'zod';
import { env } from '../../config/env.js';
import { validate } from '../../middleware/validate.js';
import { MEDIA_TYPES } from '../../models/user.model.js';
import * as service from './tmdb.service.js';

const router = Router();

const id = z.coerce.number().int().positive();
const page = z.coerce.number().int().min(1).max(500).default(1);
const mediaType = z.enum(MEDIA_TYPES);

router.get(
  '/trending/:mediaType',
  validate({
    params: z.object({ mediaType: z.enum(['all', ...MEDIA_TYPES]) }),
    query: z.object({ window: z.enum(['day', 'week']).default('week'), page }),
  }),
  async (req, res) => {
    const { mediaType: type } = req.input.params;
    const { window, page: p } = req.input.query;
    res.json(await service.getTrending(type, window, p));
  },
);

router.get(
  '/lists/:mediaType/:list',
  validate({
    params: z
      .object({ mediaType, list: z.string() })
      .refine((v) => (v.mediaType === 'movie' ? service.MOVIE_LISTS : service.TV_LISTS).includes(v.list), {
        message: 'Unknown list',
        path: ['list'],
      }),
    query: z.object({ page }),
  }),
  async (req, res) => {
    const { mediaType: type, list } = req.input.params;
    res.json(await service.getList(type, list, req.input.query.page));
  },
);

router.get(
  '/search',
  validate({
    query: z.object({
      query: z.string().trim().min(1, 'Search query is required').max(200),
      type: z.enum(['multi', 'movie', 'tv', 'person']).default('multi'),
      page,
    }),
  }),
  async (req, res) => {
    const { query, type, page: p } = req.input.query;
    res.json(await service.search(type, query, p));
  },
);

router.get(
  '/discover/:mediaType',
  validate({
    params: z.object({ mediaType }),
    query: z.object({
      genres: z.string().regex(/^\d+(,\d+)*$/).optional(),
      sortBy: z
        .enum(['popularity.desc', 'vote_average.desc', 'primary_release_date.desc', 'first_air_date.desc', 'revenue.desc'])
        .default('popularity.desc'),
      year: z.coerce.number().int().min(1870).max(2100).optional(),
      minVotes: z.coerce.number().int().min(0).default(100),
      page,
    }),
  }),
  async (req, res) => {
    res.json(await service.discover(req.input.params.mediaType, req.input.query));
  },
);

router.get('/genres/:mediaType', validate({ params: z.object({ mediaType }) }), async (req, res) => {
  res.json({ genres: await service.getGenres(req.input.params.mediaType) });
});

router.get('/movie/:id', validate({ params: z.object({ id }) }), async (req, res) => {
  res.json(await service.getMovie(req.input.params.id));
});

router.get('/tv/:id', validate({ params: z.object({ id }) }), async (req, res) => {
  res.json(await service.getTvShow(req.input.params.id));
});

router.get(
  '/tv/:id/season/:seasonNumber',
  validate({ params: z.object({ id, seasonNumber: z.coerce.number().int().min(0) }) }),
  async (req, res) => {
    const { id: tvId, seasonNumber } = req.input.params;
    res.json(await service.getSeason(tvId, seasonNumber));
  },
);

router.get('/person/:id', validate({ params: z.object({ id }) }), async (req, res) => {
  res.json(await service.getPerson(req.input.params.id));
});

router.get(
  '/:mediaType/:id/providers',
  validate({
    params: z.object({ mediaType, id }),
    query: z.object({ region: z.string().length(2).toUpperCase().default(env.TMDB_REGION) }),
  }),
  async (req, res) => {
    const { mediaType: type, id: tmdbId } = req.input.params;
    res.json(await service.getWatchProviders(type, tmdbId, req.input.query.region));
  },
);

router.post(
  '/lookup',
  validate({
    body: z.object({
      items: z.array(z.object({ mediaType, tmdbId: id })).max(100, 'At most 100 items per lookup'),
    }),
  }),
  async (req, res) => {
    res.json({ results: await service.lookup(req.input.body.items) });
  },
);

export default router;
