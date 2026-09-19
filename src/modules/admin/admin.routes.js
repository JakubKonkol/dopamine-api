import { Router } from 'express';
import { z } from 'zod';
import { badRequest, notFound } from '../../lib/errors.js';
import { requireAdmin } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { User } from '../../models/user.model.js';

const router = Router();
router.use(requireAdmin);

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid user id');

router.get('/users', async (_req, res) => {
  const users = await User.find().sort({ createdAt: -1 });
  res.json({
    users: users.map((u) => ({
      ...u.toPublic(),
      watchlistCount: u.library.watchlist.length,
      historyCount: u.library.history.length,
      playlistCount: u.playlists.length,
    })),
  });
});

router.patch(
  '/users/:id/role',
  validate({ params: z.object({ id: objectId }), body: z.object({ role: z.enum(['user', 'admin']) }) }),
  async (req, res) => {
    if (req.input.params.id === req.user.id) throw badRequest('You cannot change your own role');
    const user = await User.findById(req.input.params.id);
    if (!user) throw notFound('User not found');
    user.role = req.input.body.role;
    await user.save();
    res.json({ user: user.toPublic() });
  },
);

router.delete('/users/:id', validate({ params: z.object({ id: objectId }) }), async (req, res) => {
  if (req.input.params.id === req.user.id) throw badRequest('You cannot delete your own account here');
  const user = await User.findByIdAndDelete(req.input.params.id);
  if (!user) throw notFound('User not found');
  res.status(204).end();
});

export default router;
