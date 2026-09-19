import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { forbidden, unauthorized } from '../lib/errors.js';
import { User } from '../models/user.model.js';

export const AUTH_COOKIE = 'dopamine_token';

export function signToken(userId) {
  return jwt.sign({ sub: String(userId) }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
}

export function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.COOKIE_SECURE,
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
}

function extractToken(req) {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) return header.slice(7);
  return req.cookies?.[AUTH_COOKIE] ?? null;
}

/** Populates `req.user` when a valid token is present; never fails the request. */
export async function attachUser(req, _res, next) {
  const token = extractToken(req);
  if (!token) return next();
  try {
    const { sub } = jwt.verify(token, env.JWT_SECRET);
    req.user = await User.findById(sub);
  } catch {
    req.user = null;
  }
  next();
}

export function requireAuth(req, _res, next) {
  if (!req.user) return next(unauthorized('You need to be signed in'));
  next();
}

export function requireAdmin(req, _res, next) {
  if (!req.user) return next(unauthorized('You need to be signed in'));
  if (req.user.role !== 'admin') return next(forbidden('Admin access required'));
  next();
}
