/**
 * Hand-written OpenAPI document served at /api-docs.
 * Kept deliberately compact: it documents shapes and auth, not every field.
 */

const mediaRef = {
  type: 'object',
  properties: {
    mediaType: { type: 'string', enum: ['movie', 'tv'] },
    tmdbId: { type: 'integer' },
    addedAt: { type: 'string', format: 'date-time' },
  },
};

const summary = {
  type: 'object',
  description: 'Compact movie/TV representation used in lists',
  properties: {
    id: { type: 'integer' },
    mediaType: { type: 'string', enum: ['movie', 'tv', 'person'] },
    title: { type: 'string' },
    overview: { type: 'string' },
    posterPath: { type: 'string', nullable: true },
    backdropPath: { type: 'string', nullable: true },
    releaseDate: { type: 'string', nullable: true },
    voteAverage: { type: 'number' },
    voteCount: { type: 'integer' },
    genreIds: { type: 'array', items: { type: 'integer' } },
  },
};

const page = {
  type: 'object',
  properties: {
    page: { type: 'integer' },
    totalPages: { type: 'integer' },
    totalResults: { type: 'integer' },
    results: { type: 'array', items: summary },
  },
};

const importItem = {
  type: 'object',
  description: 'A title to import. Either tmdbId or tvdbId is required; TVDB ids are resolved through TMDB.',
  properties: {
    mediaType: { type: 'string', enum: ['movie', 'tv'] },
    tmdbId: { type: 'integer' },
    tvdbId: { type: 'integer' },
    title: { type: 'string', description: 'Only used to describe unresolved items in the summary' },
    addedAt: { type: 'string', format: 'date-time' },
  },
};

const user = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    email: { type: 'string' },
    username: { type: 'string' },
    role: { type: 'string', enum: ['user', 'admin'] },
    createdAt: { type: 'string', format: 'date-time' },
  },
};

const playlist = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    name: { type: 'string' },
    description: { type: 'string' },
    items: { type: 'array', items: mediaRef },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
};

const error = {
  type: 'object',
  properties: {
    message: { type: 'string' },
    details: { type: 'array', items: { type: 'object' } },
  },
};

const json = (schema) => ({ content: { 'application/json': { schema } } });
const secured = [{ cookieAuth: [] }, { bearerAuth: [] }];
const mediaTypeParam = { name: 'mediaType', in: 'path', required: true, schema: { type: 'string', enum: ['movie', 'tv'] } };
const idParam = { name: 'id', in: 'path', required: true, schema: { type: 'integer' } };
const pageParam = { name: 'page', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 500, default: 1 } };

export const openapi = {
  openapi: '3.0.3',
  info: {
    title: 'Dopamine API',
    version: '2.0.0',
    description:
      'REST API for Dopamine – a personal movie & TV show diary. Authentication uses a JWT stored in an httpOnly cookie (also accepted as a Bearer token).',
  },
  servers: [{ url: '/' }],
  tags: [
    { name: 'Auth' },
    { name: 'Users' },
    { name: 'Library', description: 'Watchlist and watch history' },
    { name: 'Playlists' },
    { name: 'Import', description: 'Bulk import from other apps (e.g. Bingers)' },
    { name: 'TMDB', description: 'Cached proxy over The Movie Database' },
    { name: 'Admin' },
  ],
  components: {
    securitySchemes: {
      cookieAuth: { type: 'apiKey', in: 'cookie', name: 'dopamine_token' },
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    schemas: { MediaRef: mediaRef, Summary: summary, Page: page, User: user, Playlist: playlist, Error: error },
  },
  paths: {
    '/api/health': { get: { tags: ['Auth'], summary: 'Health check', responses: { 200: { description: 'OK' } } } },

    '/api/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Create an account',
        requestBody: json({
          type: 'object',
          required: ['email', 'username', 'password'],
          properties: { email: { type: 'string' }, username: { type: 'string' }, password: { type: 'string', minLength: 8 } },
        }),
        responses: {
          201: { description: 'Created', ...json({ type: 'object', properties: { user, token: { type: 'string' } } }) },
          400: { description: 'Validation error', ...json(error) },
          409: { description: 'Email taken', ...json(error) },
        },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Sign in',
        requestBody: json({ type: 'object', required: ['email', 'password'], properties: { email: { type: 'string' }, password: { type: 'string' } } }),
        responses: {
          200: { description: 'OK', ...json({ type: 'object', properties: { user, token: { type: 'string' } } }) },
          401: { description: 'Invalid credentials', ...json(error) },
        },
      },
    },
    '/api/auth/logout': { post: { tags: ['Auth'], summary: 'Sign out (clears cookie)', responses: { 204: { description: 'No content' } } } },
    '/api/auth/session': {
      get: { tags: ['Auth'], summary: 'Current user or null (never 401)', responses: { 200: { description: 'OK', ...json({ type: 'object', properties: { user: { ...user, nullable: true } } }) } } },
    },
    '/api/auth/me': {
      get: { tags: ['Auth'], summary: 'Current user', security: secured, responses: { 200: { description: 'OK', ...json({ type: 'object', properties: { user } }) }, 401: { description: 'Unauthorized' } } },
    },

    '/api/users/me': {
      patch: {
        tags: ['Users'],
        summary: 'Update username and/or email',
        security: secured,
        requestBody: json({ type: 'object', properties: { email: { type: 'string' }, username: { type: 'string' } } }),
        responses: { 200: { description: 'OK', ...json({ type: 'object', properties: { user } }) } },
      },
      delete: {
        tags: ['Users'],
        summary: 'Delete own account',
        security: secured,
        requestBody: json({ type: 'object', required: ['password'], properties: { password: { type: 'string' } } }),
        responses: { 204: { description: 'Deleted' } },
      },
    },
    '/api/users/me/password': {
      put: {
        tags: ['Users'],
        summary: 'Change password',
        security: secured,
        requestBody: json({ type: 'object', required: ['currentPassword', 'newPassword'], properties: { currentPassword: { type: 'string' }, newPassword: { type: 'string' } } }),
        responses: { 204: { description: 'Changed' } },
      },
    },

    '/api/library': {
      get: {
        tags: ['Library'],
        summary: 'Watchlist and history',
        security: secured,
        responses: { 200: { description: 'OK', ...json({ type: 'object', properties: { watchlist: { type: 'array', items: mediaRef }, history: { type: 'array', items: mediaRef } } }) } },
      },
    },
    '/api/library/stats': {
      get: { tags: ['Library'], summary: 'Viewing statistics', security: secured, responses: { 200: { description: 'OK' } } },
    },
    '/api/library/{list}/{mediaType}/{tmdbId}': {
      put: {
        tags: ['Library'],
        summary: 'Add to watchlist or history (idempotent). Adding to history removes from watchlist.',
        security: secured,
        parameters: [
          { name: 'list', in: 'path', required: true, schema: { type: 'string', enum: ['watchlist', 'history'] } },
          mediaTypeParam,
          { name: 'tmdbId', in: 'path', required: true, schema: { type: 'integer' } },
        ],
        responses: { 200: { description: 'Updated library' } },
      },
      delete: {
        tags: ['Library'],
        summary: 'Remove from watchlist or history',
        security: secured,
        parameters: [
          { name: 'list', in: 'path', required: true, schema: { type: 'string', enum: ['watchlist', 'history'] } },
          mediaTypeParam,
          { name: 'tmdbId', in: 'path', required: true, schema: { type: 'integer' } },
        ],
        responses: { 200: { description: 'Updated library' } },
      },
    },

    '/api/import': {
      post: {
        tags: ['Import'],
        summary: 'Merge a library bundle into the account',
        description:
          'Idempotent merge: nothing is removed, duplicates are skipped, history wins over the watchlist and playlists are matched by name.',
        security: secured,
        requestBody: json({
          type: 'object',
          properties: {
            watchlist: { type: 'array', items: importItem },
            history: { type: 'array', items: importItem },
            playlists: {
              type: 'array',
              items: {
                type: 'object',
                required: ['name'],
                properties: { name: { type: 'string' }, description: { type: 'string' }, items: { type: 'array', items: importItem } },
              },
            },
          },
        }),
        responses: {
          200: {
            description: 'Import summary and the updated library',
            ...json({
              type: 'object',
              properties: {
                added: {
                  type: 'object',
                  properties: { history: { type: 'integer' }, watchlist: { type: 'integer' }, playlists: { type: 'integer' }, playlistItems: { type: 'integer' } },
                },
                skipped: {
                  type: 'object',
                  properties: { alreadyPresent: { type: 'integer' }, unresolved: { type: 'array', items: importItem } },
                },
                library: { type: 'object', properties: { watchlist: { type: 'array', items: mediaRef }, history: { type: 'array', items: mediaRef } } },
              },
            }),
          },
        },
      },
    },

    '/api/playlists': {
      get: { tags: ['Playlists'], summary: 'List playlists', security: secured, responses: { 200: { description: 'OK', ...json({ type: 'object', properties: { playlists: { type: 'array', items: playlist } } }) } } },
      post: {
        tags: ['Playlists'],
        summary: 'Create playlist',
        security: secured,
        requestBody: json({ type: 'object', required: ['name'], properties: { name: { type: 'string' }, description: { type: 'string' } } }),
        responses: { 201: { description: 'Created', ...json({ type: 'object', properties: { playlist } }) } },
      },
    },
    '/api/playlists/{id}': {
      get: { tags: ['Playlists'], summary: 'Get playlist', security: secured, parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'OK' }, 404: { description: 'Not found' } } },
      patch: { tags: ['Playlists'], summary: 'Rename / describe playlist', security: secured, parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], requestBody: json({ type: 'object', properties: { name: { type: 'string' }, description: { type: 'string' } } }), responses: { 200: { description: 'OK' } } },
      delete: { tags: ['Playlists'], summary: 'Delete playlist', security: secured, parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 204: { description: 'Deleted' } } },
    },
    '/api/playlists/{id}/items': {
      post: {
        tags: ['Playlists'],
        summary: 'Add a title to a playlist',
        security: secured,
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: json({ type: 'object', required: ['mediaType', 'tmdbId'], properties: { mediaType: { type: 'string', enum: ['movie', 'tv'] }, tmdbId: { type: 'integer' } } }),
        responses: { 200: { description: 'Updated playlist' } },
      },
    },
    '/api/playlists/{id}/items/{mediaType}/{tmdbId}': {
      delete: {
        tags: ['Playlists'],
        summary: 'Remove a title from a playlist',
        security: secured,
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }, mediaTypeParam, { name: 'tmdbId', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: { description: 'Updated playlist' } },
      },
    },

    '/api/tmdb/trending/{mediaType}': {
      get: {
        tags: ['TMDB'],
        summary: 'Trending titles',
        parameters: [{ name: 'mediaType', in: 'path', required: true, schema: { type: 'string', enum: ['all', 'movie', 'tv'] } }, { name: 'window', in: 'query', schema: { type: 'string', enum: ['day', 'week'], default: 'week' } }, pageParam],
        responses: { 200: { description: 'OK', ...json(page) } },
      },
    },
    '/api/tmdb/lists/{mediaType}/{list}': {
      get: {
        tags: ['TMDB'],
        summary: 'Curated lists (movie: popular, top_rated, upcoming, now_playing; tv: popular, top_rated, on_the_air, airing_today)',
        parameters: [mediaTypeParam, { name: 'list', in: 'path', required: true, schema: { type: 'string' } }, pageParam],
        responses: { 200: { description: 'OK', ...json(page) } },
      },
    },
    '/api/tmdb/search': {
      get: {
        tags: ['TMDB'],
        summary: 'Search movies, TV shows and people',
        parameters: [{ name: 'query', in: 'query', required: true, schema: { type: 'string' } }, { name: 'type', in: 'query', schema: { type: 'string', enum: ['multi', 'movie', 'tv', 'person'], default: 'multi' } }, pageParam],
        responses: { 200: { description: 'OK', ...json(page) } },
      },
    },
    '/api/tmdb/discover/{mediaType}': {
      get: {
        tags: ['TMDB'],
        summary: 'Discover by genre / year / sort',
        parameters: [mediaTypeParam, { name: 'genres', in: 'query', schema: { type: 'string', example: '28,12' } }, { name: 'sortBy', in: 'query', schema: { type: 'string', default: 'popularity.desc' } }, { name: 'year', in: 'query', schema: { type: 'integer' } }, pageParam],
        responses: { 200: { description: 'OK', ...json(page) } },
      },
    },
    '/api/tmdb/genres/{mediaType}': { get: { tags: ['TMDB'], summary: 'Genre list', parameters: [mediaTypeParam], responses: { 200: { description: 'OK' } } } },
    '/api/tmdb/movie/{id}': { get: { tags: ['TMDB'], summary: 'Movie details with credits, videos, images, recommendations and PL watch providers', parameters: [idParam], responses: { 200: { description: 'OK' }, 404: { description: 'Not found' } } } },
    '/api/tmdb/tv/{id}': { get: { tags: ['TMDB'], summary: 'TV show details with seasons, credits, videos, recommendations and PL watch providers', parameters: [idParam], responses: { 200: { description: 'OK' }, 404: { description: 'Not found' } } } },
    '/api/tmdb/tv/{id}/season/{seasonNumber}': { get: { tags: ['TMDB'], summary: 'Season with episodes', parameters: [idParam, { name: 'seasonNumber', in: 'path', required: true, schema: { type: 'integer' } }], responses: { 200: { description: 'OK' } } } },
    '/api/tmdb/person/{id}': { get: { tags: ['TMDB'], summary: 'Person details with combined credits', parameters: [idParam], responses: { 200: { description: 'OK' } } } },
    '/api/tmdb/{mediaType}/{id}/providers': {
      get: {
        tags: ['TMDB'],
        summary: 'Where to watch (JustWatch data via TMDB) for a region',
        parameters: [mediaTypeParam, idParam, { name: 'region', in: 'query', schema: { type: 'string', default: 'PL' } }],
        responses: { 200: { description: 'OK' } },
      },
    },
    '/api/tmdb/lookup': {
      post: {
        tags: ['TMDB'],
        summary: 'Resolve up to 100 media references into summaries',
        requestBody: json({ type: 'object', properties: { items: { type: 'array', items: mediaRef } } }),
        responses: { 200: { description: 'OK' } },
      },
    },

    '/api/admin/users': { get: { tags: ['Admin'], summary: 'List all users', security: secured, responses: { 200: { description: 'OK' }, 403: { description: 'Forbidden' } } } },
    '/api/admin/users/{id}/role': {
      patch: { tags: ['Admin'], summary: 'Change user role', security: secured, parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], requestBody: json({ type: 'object', properties: { role: { type: 'string', enum: ['user', 'admin'] } } }), responses: { 200: { description: 'OK' } } },
    },
    '/api/admin/users/{id}': {
      delete: { tags: ['Admin'], summary: 'Delete a user', security: secured, parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 204: { description: 'Deleted' } } },
    },
  },
};
