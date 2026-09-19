import bcrypt from 'bcryptjs';
import { Router } from 'express';
import { z } from 'zod';
import { conflict, unauthorized } from '../../lib/errors.js';
import { AUTH_COOKIE, cookieOptions, requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { User } from '../../models/user.model.js';
import { email, password, username } from '../auth/auth.schemas.js';

const router = Router();
router.use(requireAuth);

const updateProfileSchema = z
  .object({ email: email.optional(), username: username.optional() })
  .refine((v) => v.email !== undefined || v.username !== undefined, {
    message: 'Provide at least one field to update',
  });

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: password,
});

const deleteAccountSchema = z.object({ password: z.string().min(1, 'Password is required') });

router.patch('/me', validate({ body: updateProfileSchema }), async (req, res) => {
  const { email: newEmail, username: newUsername } = req.input.body;

  if (newEmail && newEmail !== req.user.email && (await User.exists({ email: newEmail }))) {
    throw conflict('An account with this email already exists');
  }

  if (newEmail) req.user.email = newEmail;
  if (newUsername) req.user.username = newUsername;
  await req.user.save();

  res.json({ user: req.user.toPublic() });
});

router.put('/me/password', validate({ body: changePasswordSchema }), async (req, res) => {
  const { currentPassword, newPassword } = req.input.body;
  const user = await User.findById(req.user._id).select('+passwordHash');

  if (!(await bcrypt.compare(currentPassword, user.passwordHash))) {
    throw unauthorized('Current password is incorrect');
  }

  user.passwordHash = await bcrypt.hash(newPassword, 12);
  await user.save();
  res.status(204).end();
});

router.delete('/me', validate({ body: deleteAccountSchema }), async (req, res) => {
  const user = await User.findById(req.user._id).select('+passwordHash');
  if (!(await bcrypt.compare(req.input.body.password, user.passwordHash))) {
    throw unauthorized('Password is incorrect');
  }
  await user.deleteOne();
  res.clearCookie(AUTH_COOKIE, { ...cookieOptions(), maxAge: undefined });
  res.status(204).end();
});

export default router;
