import { Router } from 'express';
import db from '../db.js';

const router = Router();

// GET /api/ranking — return all players ranked by highest score across completed games
router.get('/', (req, res) => {
  const ranking = db.prepare(`
    SELECT u.username, MAX(g.score) AS best_score
    FROM games g
    JOIN users u ON u.id = g.user_id
    WHERE g.completed_at IS NOT NULL
    GROUP BY g.user_id
    ORDER BY best_score DESC
  `).all();

  res.json({ ranking });
});

export default router;
