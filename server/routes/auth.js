import { Router } from 'express';
import passport from 'passport';
import { body, validationResult } from 'express-validator';

const router = Router();

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

router.delete('/current', (req, res) => {
  req.logout(() => res.end());
});

router.get('/current', (req, res) => {
  if (req.isAuthenticated()) return res.json(req.user);
  res.status(401).json({ error: 'Not authenticated.' });
});

export default router;
