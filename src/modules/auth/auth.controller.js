import bcrypt from 'bcryptjs';
import { conflict, unauthorized } from '../../lib/errors.js';
import { AUTH_COOKIE, cookieOptions, signToken } from '../../middleware/auth.js';
import { User } from '../../models/user.model.js';

const BCRYPT_ROUNDS = 12;

function sendSession(res, user, status = 200) {
  const token = signToken(user._id);
  res.cookie(AUTH_COOKIE, token, cookieOptions());
  res.status(status).json({ user: user.toPublic(), token });
}

export async function register(req, res) {
  const { email, username, password } = req.input.body;

  if (await User.exists({ email })) {
    throw conflict('An account with this email already exists');
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const user = await User.create({ email, username, passwordHash });
  sendSession(res, user, 201);
}

export async function login(req, res) {
  const { email, password } = req.input.body;

  const user = await User.findOne({ email }).select('+passwordHash');
  const ok = user && (await bcrypt.compare(password, user.passwordHash));
  if (!ok) throw unauthorized('Invalid email or password');

  sendSession(res, user);
}

export function logout(_req, res) {
  res.clearCookie(AUTH_COOKIE, { ...cookieOptions(), maxAge: undefined });
  res.status(204).end();
}

export function me(req, res) {
  res.json({ user: req.user.toPublic() });
}
