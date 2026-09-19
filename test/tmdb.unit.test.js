import { describe, expect, it, vi } from 'vitest';
import { TtlCache } from '../src/lib/cache.js';
import { normalizeWatchProviders, toPage, toSummary } from '../src/lib/tmdb.js';

describe('normalizeWatchProviders', () => {
  const results = {
    PL: {
      link: 'https://www.themoviedb.org/movie/550/watch?locale=PL',
      flatrate: [
        { provider_id: 8, provider_name: 'Netflix', logo_path: '/n.png', display_priority: 5 },
        { provider_id: 1, provider_name: 'Player', logo_path: '/p.png', display_priority: 1 },
      ],
      rent: [{ provider_id: 2, provider_name: 'Apple TV', logo_path: '/a.png', display_priority: 3 }],
    },
  };

  it('picks the region, sorts by priority and fills missing categories', () => {
    const out = normalizeWatchProviders(results, 'PL');
    expect(out.region).toBe('PL');
    expect(out.available).toBe(true);
    expect(out.flatrate.map((p) => p.name)).toEqual(['Player', 'Netflix']);
    expect(out.rent).toHaveLength(1);
    expect(out.buy).toEqual([]);
    expect(out.free).toEqual([]);
    expect(out.ads).toEqual([]);
    expect(out.link).toContain('locale=PL');
  });

  it('returns an empty block for unknown regions', () => {
    const out = normalizeWatchProviders(results, 'US');
    expect(out.available).toBe(false);
    expect(out.link).toBeNull();
    expect(out.flatrate).toEqual([]);
  });
});

describe('toSummary', () => {
  it('maps a movie payload', () => {
    const s = toSummary({ id: 1, title: 'Film', release_date: '2020-01-02', genre_ids: [1], vote_average: 7.25 }, 'movie');
    expect(s).toMatchObject({ id: 1, mediaType: 'movie', title: 'Film', releaseDate: '2020-01-02', genreIds: [1], voteAverage: 7.25 });
  });

  it('maps a tv payload and infers the media type', () => {
    const s = toSummary({ id: 2, name: 'Show', first_air_date: '2019-05-05', episode_run_time: [45], genres: [{ id: 9 }] });
    expect(s.mediaType).toBe('tv');
    expect(s.title).toBe('Show');
    expect(s.releaseDate).toBe('2019-05-05');
    expect(s.runtime).toBe(45);
    expect(s.genreIds).toEqual([9]);
  });

  it('maps a person payload', () => {
    const s = toSummary({ id: 3, media_type: 'person', name: 'Actor', known_for: [{ id: 4, title: 'X' }] });
    expect(s.mediaType).toBe('person');
    expect(s.knownFor[0]).toMatchObject({ id: 4, mediaType: 'movie' });
  });
});

describe('toPage', () => {
  it('caps total pages at 500', () => {
    expect(toPage({ page: 1, total_pages: 9000, total_results: 1, results: [] }).totalPages).toBe(500);
  });
});

describe('TtlCache', () => {
  it('expires entries and dedupes in-flight factories', async () => {
    vi.useFakeTimers();
    const cache = new TtlCache();
    const factory = vi.fn(async () => 'value');

    const [a, b] = await Promise.all([cache.remember('k', 1000, factory), cache.remember('k', 1000, factory)]);
    expect(a).toBe('value');
    expect(b).toBe('value');
    expect(factory).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(1001);
    expect(cache.get('k')).toBeUndefined();
    vi.useRealTimers();
  });

  it('drops a failed factory so it can be retried', async () => {
    const cache = new TtlCache();
    await expect(cache.remember('x', 1000, async () => { throw new Error('boom'); })).rejects.toThrow('boom');
    expect(cache.get('x')).toBeUndefined();
  });
});
