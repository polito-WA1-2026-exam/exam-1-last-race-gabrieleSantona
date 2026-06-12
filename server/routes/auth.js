import { Router } from 'express';
import passport from 'passport';

const router = Router();

router.post('/', passport.authenticate('local'), (req, res) => {
  res.status(201).json(req.user);
});

router.delete('/current', (req, res) => {
  req.logout(() => res.end());
});

router.get('/current', (req, res) => {
  if (req.isAuthenticated()) return res.json(req.user);
  res.status(401).json({ error: 'Not authenticated.' });
});

export default router;
