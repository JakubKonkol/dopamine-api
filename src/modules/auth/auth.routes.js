import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { isTest } from '../../config/env.js';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import * as controller from './auth.controller.js';
import { loginSchema, registerSchema } from './auth.schemas.js';

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: isTest ? 1000 : 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: 'Too many attempts, please try again later' },
});

router.post('/register', authLimiter, validate({ body: registerSchema }), controller.register);
router.post('/login', authLimiter, validate({ body: loginSchema }), controller.login);
router.post('/logout', controller.logout);
router.get('/me', requireAuth, controller.me);

export default router;
