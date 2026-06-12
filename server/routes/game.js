import { Router } from 'express';
import db from '../db.js';
import { bfs, adjacency, validateRoute } from '../network.js';

const router = Router();

function requireAuth(req, res, next) {
  if (!req.isAuthenticated()) return res.status(401).json({ error: 'Not authenticated.' });
  next();
}

function stationById(id) {
  return db.prepare('SELECT id, name FROM stations WHERE id = ?').get(id);
}

// POST /api/games — start a new game
router.post('/', requireAuth, (req, res) => {
  const allStationIds = [...adjacency.keys()];
  let start, dest;
  let attempts = 0;
  do {
    start = allStationIds[Math.floor(Math.random() * allStationIds.length)];
    const distances = bfs(start);
    const candidates = [...distances.entries()]
      .filter(([id, d]) => d >= 3 && id !== start)
      .map(([id]) => id);
    if (candidates.length > 0) {
      dest = candidates[Math.floor(Math.random() * candidates.length)];
    }
    attempts++;
  } while (!dest && attempts < 200);

  if (!dest) return res.status(500).json({ error: 'Could not find valid start/destination pair.' });

  const result = db.prepare(
    `INSERT INTO games
       (user_id, start_id, destination_id, current_station_id, current_line_ids, score, completed_at)
     VALUES (?, ?, ?, ?, NULL, 20, NULL)`
  ).run(req.user.id, start, dest, start);

  const gameId = result.lastInsertRowid;

  res.status(201).json({
    gameId,
    start:       stationById(start),
    destination: stationById(dest),
    coins:       20,
  });
});

// POST /api/games/:id/submit-route — validate a planned route and apply events
router.post('/:id/submit-route', requireAuth, (req, res) => {
  const gameId           = Number(req.params.id);
  const submittedSegments = req.body.segments;

  if (!Array.isArray(submittedSegments)) {
    return res.status(400).json({ error: 'segments array is required.' });
  }

  const game = db.prepare('SELECT * FROM games WHERE id = ?').get(gameId);
  if (!game)                        return res.status(404).json({ error: 'Game not found.' });
  if (game.user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden.' });
  if (game.completed_at !== null)   return res.status(400).json({ error: 'Game already completed.' });

  const valid = validateRoute(submittedSegments, game.start_id, game.destination_id);

  // Fetch previous best before marking this game complete (exclude current game)
  const prevRow      = db.prepare(
    'SELECT MAX(score) AS best FROM games WHERE user_id = ? AND id != ? AND completed_at IS NOT NULL'
  ).get(req.user.id, gameId);
  const previousBest = prevRow?.best ?? null;

  if (!valid) {
    db.prepare('UPDATE games SET score = 0, completed_at = ? WHERE id = ?')
      .run(new Date().toISOString(), gameId);
    return res.json({ valid: false, steps: [], finalScore: 0, previousBest, improved: false });
  }

  const allStations = new Map(
    db.prepare('SELECT id, name FROM stations').all().map(s => [s.id, { id: s.id, name: s.name }])
  );
  const events = db.prepare('SELECT * FROM events').all();
  const steps  = [];
  let coins    = 20;

  db.transaction(() => {
    for (let i = 0; i < submittedSegments.length; i++) {
      const seg   = submittedSegments[i];
      const event = events[Math.floor(Math.random() * events.length)];
      coins = Math.max(0, coins + event.effect);

      db.prepare(
        `INSERT INTO game_segments (game_id, position, station_a_id, station_b_id, event_id, coins_after)
         VALUES (?, ?, ?, ?, ?, ?)`
      ).run(gameId, i + 1, seg.station_a_id, seg.station_b_id, event.id, coins);

      steps.push({
        station_a:  allStations.get(seg.station_a_id),
        station_b:  allStations.get(seg.station_b_id),
        event:      { description: event.description, effect: event.effect },
        coins_after: coins,
      });
    }

    db.prepare('UPDATE games SET score = ?, completed_at = ? WHERE id = ?')
      .run(coins, new Date().toISOString(), gameId);
  })();

  const improved = coins > (previousBest ?? 0);
  return res.json({ valid: true, steps, finalScore: coins, previousBest, improved });
});

export default router;
