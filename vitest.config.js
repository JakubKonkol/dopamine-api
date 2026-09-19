import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    fileParallelism: false,
    env: {
      NODE_ENV: 'test',
      MONGODB_URI: process.env.MONGODB_TEST_URI ?? 'mongodb://127.0.0.1:27017/dopamine-test',
      JWT_SECRET: 'test-secret-that-is-long-enough',
      TMDB_API_KEY: process.env.TMDB_API_KEY ?? 'test-key',
      CORS_ORIGIN: 'http://localhost:4200',
    },
  },
});
