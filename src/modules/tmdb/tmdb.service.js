import { env } from '../../config/env.js';
import { normalizeWatchProviders, tmdbGet, toPage, toSummary, TTL } from '../../lib/tmdb.js';

export const MOVIE_LISTS = ['popular', 'top_rated', 'upcoming', 'now_playing'];
export const TV_LISTS = ['popular', 'top_rated', 'on_the_air', 'airing_today'];

const mapPerson = (p) => ({
  id: p.id,
  name: p.name,
  profilePath: p.profile_path ?? null,
});

function mapCredits(credits, { mediaType } = {}) {
  const cast = (credits?.cast ?? [])
    .slice()
    .sort((a, b) => a.order - b.order)
    .slice(0, 24)
    .map((c) => ({ ...mapPerson(c), character: c.character ?? (c.roles?.[0]?.character ?? '') }));

  const keyJobs = mediaType === 'tv' ? ['Creator', 'Executive Producer', 'Director', 'Writer'] : ['Director', 'Writer', 'Screenplay', 'Producer'];
  const crewMap = new Map();
  for (const c of credits?.crew ?? []) {
    // /credits has a single `job`; /aggregate_credits has `jobs: [{ job }]`.
    const jobs = (c.jobs ? c.jobs.map((j) => j.job) : [c.job]).filter((j) => keyJobs.includes(j));
    if (jobs.length === 0) continue;
    const existing = crewMap.get(c.id);
    if (existing) existing.jobs.push(...jobs);
    else crewMap.set(c.id, { ...mapPerson(c), jobs });
  }
  const crew = [...crewMap.values()].sort((a, b) => keyJobs.indexOf(a.jobs[0]) - keyJobs.indexOf(b.jobs[0])).slice(0, 8);

  return { cast, crew };
}

function mapVideos(videos) {
  const wanted = ['Trailer', 'Teaser', 'Clip'];
  return (videos?.results ?? [])
    .filter((v) => v.site === 'YouTube' && wanted.includes(v.type))
    .sort((a, b) => wanted.indexOf(a.type) - wanted.indexOf(b.type) || (b.official === true) - (a.official === true))
    .slice(0, 6)
    .map((v) => ({ key: v.key, name: v.name, type: v.type, official: v.official ?? false }));
}

function mapImages(images) {
  const byVotes = (a, b) => b.vote_average - a.vote_average || b.vote_count - a.vote_count;
  return {
    backdrops: (images?.backdrops ?? []).slice().sort(byVotes).slice(0, 10).map((i) => i.file_path),
    logos: (images?.logos ?? [])
      .filter((i) => !i.iso_639_1 || i.iso_639_1 === 'en')
      .sort(byVotes)
      .slice(0, 1)
      .map((i) => i.file_path),
  };
}

function movieCertification(releaseDates) {
  const list = releaseDates?.results ?? [];
  for (const region of [env.TMDB_REGION, 'US']) {
    const entry = list.find((r) => r.iso_3166_1 === region);
    const cert = entry?.release_dates?.find((d) => d.certification)?.certification;
    if (cert) return cert;
  }
  return null;
}

function tvCertification(contentRatings) {
  const list = contentRatings?.results ?? [];
  for (const region of [env.TMDB_REGION, 'US']) {
    const cert = list.find((r) => r.iso_3166_1 === region)?.rating;
    if (cert) return cert;
  }
  return null;
}

export async function getMovie(id) {
  const d = await tmdbGet(`/movie/${id}`, {
    append_to_response: 'credits,videos,images,recommendations,release_dates,watch/providers',
    include_image_language: 'en,null',
  });

  return {
    ...toSummary(d, 'movie'),
    tagline: d.tagline ?? '',
    status: d.status ?? null,
    homepage: d.homepage || null,
    imdbId: d.imdb_id || null,
    budget: d.budget ?? 0,
    revenue: d.revenue ?? 0,
    originalLanguage: d.original_language ?? null,
    genres: d.genres ?? [],
    spokenLanguages: (d.spoken_languages ?? []).map((l) => l.english_name ?? l.name),
    productionCompanies: (d.production_companies ?? []).map((c) => ({ id: c.id, name: c.name, logoPath: c.logo_path ?? null })),
    productionCountries: (d.production_countries ?? []).map((c) => c.name),
    certification: movieCertification(d.release_dates),
    collection: d.belongs_to_collection
      ? { id: d.belongs_to_collection.id, name: d.belongs_to_collection.name, posterPath: d.belongs_to_collection.poster_path ?? null }
      : null,
    credits: mapCredits(d.credits, { mediaType: 'movie' }),
    videos: mapVideos(d.videos),
    images: mapImages(d.images),
    recommendations: (d.recommendations?.results ?? []).slice(0, 20).map((r) => toSummary(r, 'movie')),
    watchProviders: normalizeWatchProviders(d['watch/providers']?.results),
  };
}

export async function getTvShow(id) {
  const d = await tmdbGet(`/tv/${id}`, {
    append_to_response: 'aggregate_credits,videos,images,recommendations,content_ratings,watch/providers',
    include_image_language: 'en,null',
  });

  const mapEpisode = (e) =>
    e
      ? {
          id: e.id,
          name: e.name,
          overview: e.overview ?? '',
          airDate: e.air_date ?? null,
          seasonNumber: e.season_number,
          episodeNumber: e.episode_number,
          runtime: e.runtime ?? null,
          stillPath: e.still_path ?? null,
        }
      : null;

  return {
    ...toSummary(d, 'tv'),
    tagline: d.tagline ?? '',
    status: d.status ?? null,
    type: d.type ?? null,
    homepage: d.homepage || null,
    originalLanguage: d.original_language ?? null,
    inProduction: d.in_production ?? false,
    firstAirDate: d.first_air_date ?? null,
    lastAirDate: d.last_air_date ?? null,
    numberOfSeasons: d.number_of_seasons ?? 0,
    numberOfEpisodes: d.number_of_episodes ?? 0,
    episodeRunTime: d.episode_run_time?.[0] ?? d.last_episode_to_air?.runtime ?? null,
    genres: d.genres ?? [],
    createdBy: (d.created_by ?? []).map(mapPerson),
    networks: (d.networks ?? []).map((n) => ({ id: n.id, name: n.name, logoPath: n.logo_path ?? null })),
    productionCompanies: (d.production_companies ?? []).map((c) => ({ id: c.id, name: c.name, logoPath: c.logo_path ?? null })),
    productionCountries: (d.production_countries ?? []).map((c) => c.name),
    spokenLanguages: (d.spoken_languages ?? []).map((l) => l.english_name ?? l.name),
    certification: tvCertification(d.content_ratings),
    seasons: (d.seasons ?? [])
      .filter((s) => s.season_number > 0)
      .map((s) => ({
        id: s.id,
        name: s.name,
        seasonNumber: s.season_number,
        episodeCount: s.episode_count,
        airDate: s.air_date ?? null,
        posterPath: s.poster_path ?? null,
        overview: s.overview ?? '',
        voteAverage: s.vote_average ?? 0,
      })),
    lastEpisodeToAir: mapEpisode(d.last_episode_to_air),
    nextEpisodeToAir: mapEpisode(d.next_episode_to_air),
    credits: (() => {
      const credits = mapCredits(d.aggregate_credits, { mediaType: 'tv' });
      const creators = (d.created_by ?? []).map((p) => ({ ...mapPerson(p), jobs: ['Creator'] }));
      const rest = credits.crew.filter((c) => !creators.some((cr) => cr.id === c.id));
      return { cast: credits.cast, crew: [...creators, ...rest].slice(0, 8) };
    })(),
    videos: mapVideos(d.videos),
    images: mapImages(d.images),
    recommendations: (d.recommendations?.results ?? []).slice(0, 20).map((r) => toSummary(r, 'tv')),
    watchProviders: normalizeWatchProviders(d['watch/providers']?.results),
  };
}

export async function getSeason(tvId, seasonNumber) {
  const d = await tmdbGet(`/tv/${tvId}/season/${seasonNumber}`);
  return {
    id: d.id,
    name: d.name,
    seasonNumber: d.season_number,
    overview: d.overview ?? '',
    airDate: d.air_date ?? null,
    posterPath: d.poster_path ?? null,
    episodes: (d.episodes ?? []).map((e) => ({
      id: e.id,
      name: e.name,
      overview: e.overview ?? '',
      airDate: e.air_date ?? null,
      episodeNumber: e.episode_number,
      runtime: e.runtime ?? null,
      stillPath: e.still_path ?? null,
      voteAverage: e.vote_average ?? 0,
    })),
  };
}

export async function getPerson(id) {
  const d = await tmdbGet(`/person/${id}`, { append_to_response: 'combined_credits,external_ids' });

  // One entry per title, keep the most prominent credit.
  const seen = new Map();
  for (const c of d.combined_credits?.cast ?? []) {
    const key = `${c.media_type}:${c.id}`;
    if (!seen.has(key)) seen.set(key, { ...toSummary(c), character: c.character ?? '' });
  }
  const cast = [...seen.values()].sort((a, b) => b.voteCount - a.voteCount || b.popularity - a.popularity);

  const crewSeen = new Map();
  for (const c of d.combined_credits?.crew ?? []) {
    const key = `${c.media_type}:${c.id}`;
    const existing = crewSeen.get(key);
    if (existing) existing.jobs.push(c.job);
    else crewSeen.set(key, { ...toSummary(c), jobs: [c.job] });
  }
  const crew = [...crewSeen.values()].sort((a, b) => b.voteCount - a.voteCount || b.popularity - a.popularity);

  return {
    id: d.id,
    mediaType: 'person',
    name: d.name,
    biography: d.biography ?? '',
    birthday: d.birthday ?? null,
    deathday: d.deathday ?? null,
    placeOfBirth: d.place_of_birth ?? null,
    knownForDepartment: d.known_for_department ?? null,
    profilePath: d.profile_path ?? null,
    homepage: d.homepage || null,
    imdbId: d.external_ids?.imdb_id || null,
    instagramId: d.external_ids?.instagram_id || null,
    credits: { cast: cast.slice(0, 40), crew: crew.slice(0, 40) },
  };
}

export async function getTrending(mediaType, window, page) {
  const data = await tmdbGet(`/trending/${mediaType}/${window}`, { page }, TTL.list);
  return toPage(data, mediaType === 'all' ? undefined : mediaType);
}

export async function getList(mediaType, list, page) {
  const params = { page };
  if (mediaType === 'movie' && (list === 'upcoming' || list === 'now_playing')) params.region = env.TMDB_REGION;
  const data = await tmdbGet(`/${mediaType}/${list}`, params, TTL.list);
  return toPage(data, mediaType);
}

export async function search(type, query, page) {
  const data = await tmdbGet(`/search/${type}`, { query, page, include_adult: false }, TTL.search);
  return toPage(data, type === 'multi' ? undefined : type);
}

export async function discover(mediaType, { genres, sortBy, year, page, minVotes }) {
  const params = { page, sort_by: sortBy, 'vote_count.gte': minVotes, include_adult: false };
  if (genres) params.with_genres = genres;
  if (year) {
    if (mediaType === 'movie') params.primary_release_year = year;
    else params.first_air_date_year = year;
  }
  const data = await tmdbGet(`/discover/${mediaType}`, params, TTL.list);
  return toPage(data, mediaType);
}

export async function getGenres(mediaType) {
  const data = await tmdbGet(`/genre/${mediaType}/list`, {}, TTL.genres);
  return data.genres ?? [];
}

export async function getWatchProviders(mediaType, id, region) {
  const data = await tmdbGet(`/${mediaType}/${id}/watch/providers`);
  return normalizeWatchProviders(data.results, region);
}

/** Resolves a batch of library references into summaries, preserving order. */
export async function lookup(items) {
  const results = await Promise.allSettled(
    items.map((ref) => tmdbGet(`/${ref.mediaType}/${ref.tmdbId}`).then((d) => toSummary(d, ref.mediaType))),
  );
  return results.map((r, i) => ({
    ref: items[i],
    item: r.status === 'fulfilled' ? r.value : null,
  }));
}
