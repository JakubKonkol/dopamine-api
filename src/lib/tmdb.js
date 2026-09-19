import axios from 'axios';
import { env } from '../config/env.js';
import { TtlCache } from './cache.js';
import { HttpError } from './errors.js';

const MINUTE = 60_000;
export const TTL = {
  list: 10 * MINUTE,
  details: 60 * MINUTE,
  search: 5 * MINUTE,
  genres: 24 * 60 * MINUTE,
};

const cache = new TtlCache();

const client = axios.create({
  baseURL: 'https://api.themoviedb.org/3',
  timeout: 10_000,
  params: {
    api_key: env.TMDB_API_KEY,
    language: env.TMDB_LANGUAGE,
  },
});

/**
 * GET from TMDB with caching. TMDB errors are translated to HttpErrors so the
 * client sees a meaningful status (404 for unknown ids, 502 otherwise).
 */
export async function tmdbGet(path, params = {}, ttl = TTL.details) {
  const key = `${path}?${new URLSearchParams(params).toString()}`;
  return cache.remember(key, ttl, async () => {
    try {
      const { data } = await client.get(path, { params });
      return data;
    } catch (err) {
      const status = err.response?.status;
      if (status === 404) throw new HttpError(404, 'Title not found on TMDB');
      if (status === 401) throw new HttpError(502, 'TMDB rejected the API key');
      if (status === 429) throw new HttpError(429, 'TMDB rate limit reached, try again shortly');
      throw new HttpError(502, 'TMDB is unavailable');
    }
  });
}

export function clearTmdbCache() {
  cache.clear();
}

/**
 * Picks the region block out of a `watch/providers` payload and makes every
 * category present so consumers never have to null-check.
 */
export function normalizeWatchProviders(results, region = env.TMDB_REGION) {
  const block = results?.[region] ?? {};
  const pick = (key) =>
    [...(block[key] ?? [])]
      .sort((a, b) => a.display_priority - b.display_priority)
      .map((p) => ({
        id: p.provider_id,
        name: p.provider_name,
        logoPath: p.logo_path ?? null,
      }));

  const flatrate = pick('flatrate');
  const free = pick('free');
  const ads = pick('ads');
  const rent = pick('rent');
  const buy = pick('buy');

  return {
    region,
    link: block.link ?? null,
    flatrate,
    free,
    ads,
    rent,
    buy,
    available: flatrate.length + free.length + ads.length + rent.length + buy.length > 0,
  };
}

/** Compact representation used for lists, carousels and library lookups. */
export function toSummary(item, mediaTypeHint) {
  const mediaType = item.media_type ?? mediaTypeHint ?? (item.title !== undefined ? 'movie' : 'tv');

  if (mediaType === 'person') {
    return {
      id: item.id,
      mediaType,
      name: item.name,
      profilePath: item.profile_path ?? null,
      knownForDepartment: item.known_for_department ?? null,
      knownFor: (item.known_for ?? []).map((k) => toSummary(k)),
      popularity: item.popularity ?? 0,
    };
  }

  const runtime = item.runtime ?? (Array.isArray(item.episode_run_time) ? (item.episode_run_time[0] ?? null) : null);

  return {
    id: item.id,
    mediaType,
    title: item.title ?? item.name ?? '',
    originalTitle: item.original_title ?? item.original_name ?? '',
    overview: item.overview ?? '',
    posterPath: item.poster_path ?? null,
    backdropPath: item.backdrop_path ?? null,
    releaseDate: item.release_date ?? item.first_air_date ?? null,
    voteAverage: item.vote_average ?? 0,
    voteCount: item.vote_count ?? 0,
    popularity: item.popularity ?? 0,
    genreIds: item.genre_ids ?? (item.genres ?? []).map((g) => g.id),
    runtime,
  };
}

export function toPage(data, mediaTypeHint) {
  return {
    page: data.page ?? 1,
    totalPages: Math.min(data.total_pages ?? 1, 500), // TMDB caps pagination at 500
    totalResults: data.total_results ?? 0,
    results: (data.results ?? []).map((r) => toSummary(r, mediaTypeHint)),
  };
}
