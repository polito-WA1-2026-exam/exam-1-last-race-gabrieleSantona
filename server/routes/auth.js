import { Router } from 'express';
import passport from 'passport';
import { body, validationResult } from 'express-validator';

const router = Router();

// POST /api/sessions — validate credentials and create session; return 401 on auth failure
router.post('/',
  body('username').isString().trim().notEmpty(),
  body('password').isString().notEmpty(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
    next();
  },
  passport.authenticate('local'),
  (req, res) => {
    res.status(201).json(req.user);
  }
);

// DELETE /api/sessions/current — end session and clear session cookie
router.delete('/current', (req, res) => {
  req.logout(() => res.status(204).end());
});

// GET /api/sessions/current — return logged-in user or 401 if not authenticated
router.get('/current', (req, res) => {
  if (req.isAuthenticated()) return res.json(req.user);
  res.status(401).json({ error: 'Not authenticated.' });
});

export default router;
