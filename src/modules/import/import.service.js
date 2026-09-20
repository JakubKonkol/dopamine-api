import { tmdbGet, TTL } from '../../lib/tmdb.js';

const refKey = (mediaType, tmdbId) => `${mediaType}:${tmdbId}`;

/**
 * Resolves a TVDB id to a TMDB id via TMDB's `/find` endpoint. Returns `null`
 * when TMDB has no matching title of the requested type.
 */
async function findByTvdbId(mediaType, tvdbId) {
  try {
    const data = await tmdbGet(`/find/${tvdbId}`, { external_source: 'tvdb_id' }, TTL.details);
    const results = mediaType === 'movie' ? data.movie_results : data.tv_results;
    return results?.[0]?.id ?? null;
  } catch {
    return null;
  }
}

/**
 * Turns import items (which may carry only a TVDB id) into `{ mediaType, tmdbId, addedAt }`
 * refs. Unresolvable items are collected so the caller can report them.
 */
async function resolveItems(items, unresolved) {
  const resolved = await Promise.all(
    items.map(async (item) => {
      const tmdbId = item.tmdbId ?? (item.tvdbId ? await findByTvdbId(item.mediaType, item.tvdbId) : null);
      if (!tmdbId) {
        unresolved.push({ mediaType: item.mediaType, tvdbId: item.tvdbId ?? null, title: item.title ?? null });
        return null;
      }
      return { mediaType: item.mediaType, tmdbId, addedAt: item.addedAt ?? new Date() };
    }),
  );
  return resolved.filter(Boolean);
}

/** Adds refs to a list, skipping ones already present. Returns how many were added. */
function mergeRefs(list, refs) {
  const present = new Set(list.map((r) => refKey(r.mediaType, r.tmdbId)));
  let added = 0;
  for (const ref of refs) {
    const key = refKey(ref.mediaType, ref.tmdbId);
    if (present.has(key)) continue;
    present.add(key);
    list.push(ref);
    added += 1;
  }
  return added;
}

/**
 * Merges an import bundle into the user's library and playlists. Nothing is
 * ever removed: existing entries are kept, duplicates are skipped and history
 * takes precedence over the watchlist (the two are mutually exclusive).
 * Playlists are matched by name (case-insensitive) so re-running an import
 * does not create duplicates.
 *
 * @returns {Promise<{ added: object, skipped: object }>} an import summary
 */
export async function importBundle(user, bundle) {
  const unresolved = [];
  const [history, watchlist] = await Promise.all([
    resolveItems(bundle.history ?? [], unresolved),
    resolveItems(bundle.watchlist ?? [], unresolved),
  ]);

  const { library } = user;
  const historyAdded = mergeRefs(library.history, history);
  const watchedKeys = new Set(library.history.map((r) => refKey(r.mediaType, r.tmdbId)));
  const watchlistAdded = mergeRefs(
    library.watchlist,
    watchlist.filter((r) => !watchedKeys.has(refKey(r.mediaType, r.tmdbId))),
  );
  library.watchlist = library.watchlist.filter((r) => !watchedKeys.has(refKey(r.mediaType, r.tmdbId)));

  let playlistsAdded = 0;
  let playlistItemsAdded = 0;
  for (const incoming of bundle.playlists ?? []) {
    const items = await resolveItems(incoming.items ?? [], unresolved);
    let playlist = user.playlists.find((p) => p.name.toLowerCase() === incoming.name.toLowerCase());
    if (!playlist) {
      playlist = user.playlists.create({ name: incoming.name, description: incoming.description ?? '' });
      user.playlists.push(playlist);
      playlistsAdded += 1;
    }
    playlistItemsAdded += mergeRefs(playlist.items, items);
  }

  await user.save();

  const requested = history.length + watchlist.length;
  return {
    added: {
      history: historyAdded,
      watchlist: watchlistAdded,
      playlists: playlistsAdded,
      playlistItems: playlistItemsAdded,
    },
    skipped: {
      alreadyPresent: requested - historyAdded - watchlistAdded,
      unresolved,
    },
  };
}
