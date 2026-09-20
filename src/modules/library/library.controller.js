import { tmdbGet, TTL } from '../../lib/tmdb.js';

export function serializeLibrary(user) {
  const byNewest = (a, b) => b.addedAt - a.addedAt;
  return {
    watchlist: [...user.library.watchlist].sort(byNewest),
    history: [...user.library.history].sort(byNewest),
  };
}

const sameRef = (mediaType, tmdbId) => (ref) => ref.mediaType === mediaType && ref.tmdbId === tmdbId;

export function getLibrary(req, res) {
  res.json(serializeLibrary(req.user));
}

/**
 * Idempotent add. Marking a title as watched also removes it from the
 * watchlist, since "to watch" and "watched" are mutually exclusive states.
 */
export async function addToList(req, res) {
  const { list, mediaType, tmdbId } = req.input.params;
  const { library } = req.user;

  if (!library[list].some(sameRef(mediaType, tmdbId))) {
    library[list].push({ mediaType, tmdbId });
  }
  if (list === 'history') {
    library.watchlist = library.watchlist.filter((ref) => !sameRef(mediaType, tmdbId)(ref));
  }

  await req.user.save();
  res.json(serializeLibrary(req.user));
}

export async function removeFromList(req, res) {
  const { list, mediaType, tmdbId } = req.input.params;
  const { library } = req.user;

  library[list] = library[list].filter((ref) => !sameRef(mediaType, tmdbId)(ref));
  await req.user.save();
  res.json(serializeLibrary(req.user));
}

/**
 * Aggregated viewing statistics computed from TMDB details of watched titles.
 * TV runtime is an estimate (episodes x average episode length).
 */
export async function getStats(req, res) {
  const { history, watchlist } = req.user.library;

  const details = await Promise.allSettled(
    history.map((ref) => tmdbGet(`/${ref.mediaType}/${ref.tmdbId}`, {}, TTL.details).then((d) => ({ ref, d }))),
  );

  let movieMinutes = 0;
  let tvMinutes = 0;
  const genreCount = new Map();
  const decadeCount = new Map();
  let ratingSum = 0;
  let ratingCount = 0;

  for (const result of details) {
    if (result.status !== 'fulfilled') continue;
    const { ref, d } = result.value;

    if (ref.mediaType === 'movie') {
      movieMinutes += d.runtime ?? 0;
    } else {
      const perEpisode = d.episode_run_time?.[0] ?? d.last_episode_to_air?.runtime ?? 45;
      tvMinutes += (d.number_of_episodes ?? 0) * perEpisode;
    }

    for (const genre of d.genres ?? []) {
      genreCount.set(genre.name, (genreCount.get(genre.name) ?? 0) + 1);
    }

    const year = Number((d.release_date ?? d.first_air_date ?? '').slice(0, 4));
    if (year) {
      const decade = `${Math.floor(year / 10) * 10}s`;
      decadeCount.set(decade, (decadeCount.get(decade) ?? 0) + 1);
    }

    if (d.vote_average) {
      ratingSum += d.vote_average;
      ratingCount += 1;
    }
  }

  const sortedEntries = (map) =>
    [...map.entries()].sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name, count }));

  res.json({
    moviesWatched: history.filter((r) => r.mediaType === 'movie').length,
    showsWatched: history.filter((r) => r.mediaType === 'tv').length,
    watchlistCount: watchlist.length,
    playlistCount: req.user.playlists.length,
    movieMinutes,
    tvMinutes,
    totalMinutes: movieMinutes + tvMinutes,
    averageRating: ratingCount ? Math.round((ratingSum / ratingCount) * 10) / 10 : null,
    topGenres: sortedEntries(genreCount).slice(0, 5),
    decades: sortedEntries(decadeCount),
  });
}
