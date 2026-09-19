# Dopamine API 🚀

REST API for [Dopamine](https://github.com/JakubKonkol/Dopamine) – a personal movie & TV show diary.
Node.js · Express 5 · MongoDB (Mongoose) · JWT auth · cached proxy over [TMDB](https://www.themoviedb.org/).

## Features

- **Auth** – register / login / logout, JWT stored in an `httpOnly` cookie (Bearer header also accepted), bcrypt password hashing, rate-limited auth endpoints.
- **Library** – watchlist and watch history per user, viewing statistics (watch time, top genres, decades).
- **Playlists** – named collections of movies and TV shows.
- **TMDB proxy** – trending, curated lists, search, discover, rich movie / TV / person details and **"where to watch" for Poland** (JustWatch data via TMDB). Responses are normalised to camelCase and cached in memory.
- **Admin** – list users, change roles, delete accounts.
- Input validation with zod, consistent JSON errors, OpenAPI docs at `/api-docs`.

## Getting started

Requirements: Node.js ≥ 20, a running MongoDB instance, a TMDB v3 API key.

```bash
git clone https://github.com/JakubKonkol/dopamine-api.git
cd dopamine-api
npm install
cp .env.example .env      # then fill in TMDB_API_KEY and JWT_SECRET
npm run dev               # http://localhost:8080
```

`npm run dev` restarts on file changes and loads `.env` automatically. Use `npm start` in production.

### Environment variables

| Variable | Default | Description |
| --- | --- | --- |
| `PORT` | `8080` | HTTP port |
| `MONGODB_URI` | `mongodb://127.0.0.1:27017/dopamine-db` | MongoDB connection string |
| `JWT_SECRET` | – | **Required.** Long random string used to sign tokens |
| `JWT_EXPIRES_IN` | `7d` | Token lifetime |
| `COOKIE_SECURE` | `false` | Set `true` behind HTTPS |
| `CORS_ORIGIN` | `http://localhost:4200` | Comma-separated allowed origins |
| `TMDB_API_KEY` | – | **Required.** TMDB v3 API key |
| `TMDB_LANGUAGE` | `en-US` | Language for TMDB metadata |
| `TMDB_REGION` | `PL` | Region for watch providers, upcoming and now-playing lists |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | – | Optional: seed an admin account on first start |

## API overview

Full interactive documentation: **http://localhost:8080/api-docs**

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/api/auth/register` | – | Create account |
| `POST` | `/api/auth/login` | – | Sign in (sets cookie, returns token) |
| `POST` | `/api/auth/logout` | – | Clear cookie |
| `GET` | `/api/auth/me` | ✓ | Current user |
| `PATCH` | `/api/users/me` | ✓ | Update username / email |
| `PUT` | `/api/users/me/password` | ✓ | Change password |
| `DELETE` | `/api/users/me` | ✓ | Delete account |
| `GET` | `/api/library` | ✓ | Watchlist + history |
| `GET` | `/api/library/stats` | ✓ | Viewing statistics |
| `PUT` | `/api/library/:list/:mediaType/:tmdbId` | ✓ | Add to `watchlist` or `history` |
| `DELETE` | `/api/library/:list/:mediaType/:tmdbId` | ✓ | Remove from list |
| `GET` `POST` | `/api/playlists` | ✓ | List / create playlists |
| `GET` `PATCH` `DELETE` | `/api/playlists/:id` | ✓ | Read / rename / delete playlist |
| `POST` | `/api/playlists/:id/items` | ✓ | Add title to playlist |
| `DELETE` | `/api/playlists/:id/items/:mediaType/:tmdbId` | ✓ | Remove title from playlist |
| `GET` | `/api/tmdb/trending/:mediaType?window=day\|week` | – | Trending (`all`, `movie`, `tv`) |
| `GET` | `/api/tmdb/lists/:mediaType/:list` | – | `popular`, `top_rated`, `upcoming`, `now_playing`, `on_the_air`, `airing_today` |
| `GET` | `/api/tmdb/search?query=&type=multi\|movie\|tv\|person` | – | Search |
| `GET` | `/api/tmdb/discover/:mediaType?genres=&year=&sortBy=` | – | Discover |
| `GET` | `/api/tmdb/genres/:mediaType` | – | Genres |
| `GET` | `/api/tmdb/movie/:id` | – | Movie details (credits, videos, images, recommendations, watch providers) |
| `GET` | `/api/tmdb/tv/:id` | – | TV show details (+ seasons) |
| `GET` | `/api/tmdb/tv/:id/season/:n` | – | Season with episodes |
| `GET` | `/api/tmdb/person/:id` | – | Person details with credits |
| `GET` | `/api/tmdb/:mediaType/:id/providers?region=PL` | – | Where to watch |
| `POST` | `/api/tmdb/lookup` | – | Resolve up to 100 `{ mediaType, tmdbId }` refs |
| `GET` | `/api/admin/users` | admin | List users |
| `PATCH` | `/api/admin/users/:id/role` | admin | Change role |
| `DELETE` | `/api/admin/users/:id` | admin | Delete user |

Errors are always `{ "message": string, "details"?: [{ path, message }] }`.

## Scripts

```bash
npm run dev     # start with file watching
npm start       # start
npm test        # vitest (unit + integration; integration tests use MONGODB_TEST_URI or mongodb://127.0.0.1:27017/dopamine-test)
npm run lint    # eslint
```

## Project structure

```
src/
  app.js               express app factory (middleware + routes)
  server.js            bootstrap: db connection, admin seed, listen
  config/              env validation (zod), database
  lib/                 TMDB client + cache, HttpError helpers
  middleware/          auth (JWT), validation, error handling
  models/              mongoose schemas
  modules/
    auth/ users/ library/ playlists/ tmdb/ admin/
  docs/openapi.js      OpenAPI document for /api-docs
test/                  vitest + supertest
```
