import mongoose from 'mongoose';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { connectDatabase, disconnectDatabase } from '../src/config/db.js';
import { User } from '../src/models/user.model.js';

const app = createApp();
const credentials = { email: 'jane@example.com', username: 'jane_doe', password: 'correct-horse-battery' };

/** Registers a user and returns an agent that carries the auth cookie. */
async function signedInAgent(overrides = {}) {
  const agent = request.agent(app);
  await agent.post('/api/auth/register').send({ ...credentials, ...overrides }).expect(201);
  return agent;
}

beforeAll(async () => {
  await connectDatabase();
});

beforeEach(async () => {
  await User.deleteMany({});
});

afterAll(async () => {
  await mongoose.connection.db.dropDatabase();
  await disconnectDatabase();
});

describe('auth', () => {
  it('registers, returns the user and sets the auth cookie', async () => {
    const res = await request(app).post('/api/auth/register').send(credentials).expect(201);
    expect(res.body.user).toMatchObject({ email: credentials.email, username: credentials.username, role: 'user' });
    expect(res.body.user).not.toHaveProperty('passwordHash');
    expect(res.headers['set-cookie'].join(';')).toMatch(/dopamine_token=.*HttpOnly/);
  });

  it('rejects invalid payloads with field details', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: 'nope', username: 'x', password: '1' }).expect(400);
    expect(res.body.details.map((d) => d.path)).toEqual(expect.arrayContaining(['email', 'username', 'password']));
  });

  it('rejects duplicate emails', async () => {
    await request(app).post('/api/auth/register').send(credentials).expect(201);
    await request(app).post('/api/auth/register').send(credentials).expect(409);
  });

  it('logs in with the right password and rejects the wrong one', async () => {
    await request(app).post('/api/auth/register').send(credentials).expect(201);
    await request(app).post('/api/auth/login').send({ email: credentials.email, password: 'wrong-password' }).expect(401);
    const res = await request(app).post('/api/auth/login').send({ email: credentials.email, password: credentials.password }).expect(200);
    expect(res.body.token).toBeTypeOf('string');
  });

  it('accepts the token as a Bearer header and clears the cookie on logout', async () => {
    const { body } = await request(app).post('/api/auth/register').send(credentials).expect(201);
    await request(app).get('/api/auth/me').set('Authorization', `Bearer ${body.token}`).expect(200);

    const agent = await signedInAgent({ email: 'second@example.com', username: 'second' });
    await agent.post('/api/auth/logout').expect(204);
    await agent.get('/api/auth/me').expect(401);
  });
});

describe('library', () => {
  it('requires authentication', async () => {
    await request(app).get('/api/library').expect(401);
  });

  it('adds to the watchlist idempotently and moves titles to history', async () => {
    const agent = await signedInAgent();

    await agent.put('/api/library/watchlist/movie/550').expect(200);
    const dup = await agent.put('/api/library/watchlist/movie/550').expect(200);
    expect(dup.body.watchlist).toHaveLength(1);

    const watched = await agent.put('/api/library/history/movie/550').expect(200);
    expect(watched.body.watchlist).toHaveLength(0);
    expect(watched.body.history[0]).toMatchObject({ mediaType: 'movie', tmdbId: 550 });

    const removed = await agent.delete('/api/library/history/movie/550').expect(200);
    expect(removed.body.history).toHaveLength(0);
  });

  it('validates the media reference', async () => {
    const agent = await signedInAgent();
    await agent.put('/api/library/watchlist/book/1').expect(400);
    await agent.put('/api/library/favourites/movie/1').expect(400);
    await agent.put('/api/library/watchlist/movie/-3').expect(400);
  });
});

describe('playlists', () => {
  it('supports the full CRUD lifecycle', async () => {
    const agent = await signedInAgent();

    const created = await agent.post('/api/playlists').send({ name: 'Weekend' }).expect(201);
    const id = created.body.playlist.id;

    await agent.post(`/api/playlists/${id}/items`).send({ mediaType: 'tv', tmdbId: 1399 }).expect(200);
    const withDup = await agent.post(`/api/playlists/${id}/items`).send({ mediaType: 'tv', tmdbId: 1399 }).expect(200);
    expect(withDup.body.playlist.items).toHaveLength(1);

    const renamed = await agent.patch(`/api/playlists/${id}`).send({ name: 'Weekend picks' }).expect(200);
    expect(renamed.body.playlist.name).toBe('Weekend picks');

    const trimmed = await agent.delete(`/api/playlists/${id}/items/tv/1399`).expect(200);
    expect(trimmed.body.playlist.items).toHaveLength(0);

    await agent.delete(`/api/playlists/${id}`).expect(204);
    await agent.get(`/api/playlists/${id}`).expect(404);
  });

  it('does not leak playlists between users', async () => {
    const owner = await signedInAgent();
    const other = await signedInAgent({ email: 'other@example.com', username: 'other' });

    const { body } = await owner.post('/api/playlists').send({ name: 'Private' }).expect(201);
    await other.get(`/api/playlists/${body.playlist.id}`).expect(404);
  });
});

describe('users', () => {
  it('updates the profile and rejects taken emails', async () => {
    await signedInAgent({ email: 'taken@example.com', username: 'taken' });
    const agent = await signedInAgent();

    const res = await agent.patch('/api/users/me').send({ username: 'new_name' }).expect(200);
    expect(res.body.user.username).toBe('new_name');
    await agent.patch('/api/users/me').send({ email: 'taken@example.com' }).expect(409);
  });

  it('changes the password only when the current one matches', async () => {
    const agent = await signedInAgent();
    await agent.put('/api/users/me/password').send({ currentPassword: 'nope-nope-nope', newPassword: 'another-long-pass' }).expect(401);
    await agent.put('/api/users/me/password').send({ currentPassword: credentials.password, newPassword: 'another-long-pass' }).expect(204);
    await request(app).post('/api/auth/login').send({ email: credentials.email, password: 'another-long-pass' }).expect(200);
  });
});

describe('admin', () => {
  it('is forbidden for regular users', async () => {
    const agent = await signedInAgent();
    await agent.get('/api/admin/users').expect(403);
  });

  it('lists users for admins', async () => {
    const agent = await signedInAgent();
    await User.updateOne({ email: credentials.email }, { role: 'admin' });
    const res = await agent.get('/api/admin/users').expect(200);
    expect(res.body.users).toHaveLength(1);
  });
});
