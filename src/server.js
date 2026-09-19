import bcrypt from 'bcryptjs';
import { createApp } from './app.js';
import { connectDatabase } from './config/db.js';
import { env } from './config/env.js';
import { User } from './models/user.model.js';

/** Creates the admin account from ADMIN_EMAIL / ADMIN_PASSWORD if it doesn't exist yet. */
async function seedAdmin() {
  if (!env.ADMIN_EMAIL || !env.ADMIN_PASSWORD) return;
  const email = env.ADMIN_EMAIL.toLowerCase();
  if (await User.exists({ email })) return;
  await User.create({
    email,
    username: 'admin',
    role: 'admin',
    passwordHash: await bcrypt.hash(env.ADMIN_PASSWORD, 12),
  });
  console.log(`Seeded admin account ${email}`);
}

async function main() {
  await connectDatabase();
  console.log(`MongoDB connected (${env.MONGODB_URI})`);
  await seedAdmin();

  const app = createApp();
  const server = app.listen(env.PORT, () => {
    console.log(`Dopamine API listening on http://localhost:${env.PORT} (${env.NODE_ENV})`);
    console.log(`API docs: http://localhost:${env.PORT}/api-docs`);
  });

  const shutdown = (signal) => {
    console.log(`\n${signal} received, shutting down...`);
    server.close(() => process.exit(0));
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
