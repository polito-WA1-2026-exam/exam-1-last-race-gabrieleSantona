import { Router } from 'express';
import { body, param, validationResult } from 'express-validator';
import db from '../db.js';
import { bfs, adjacency, validateRoute } from '../network.js';
import { requireAuth } from '../middleware.js';

const router = Router();

const INITIAL_COINS = 20;

// Fetch station record from DB by ID; used to build game responses with station names
function stationById(id) {
  return db.prepare('SELECT id, name FROM stations WHERE id = ?').get(id);
}

// Construct game start response with ID, start/destination stations, and initial coin count
function buildStartResponse(gameId, start, destination) {
  return { gameId, start, destination, coins: INITIAL_COINS };
}

// Format route submission result: validity flag, execution steps, final score, previous best, improvement flag
function buildSubmitResponse({ valid, steps = [], finalScore = 0, previousBest, improved = false }) {
  return { valid, steps, finalScore, previousBest, improved };
}

// POST /api/games — create new game with random start/destination pair ≥3 segments apart
router.post('/', requireAuth, (req, res) => {
  const allStationIds = [...adjacency.keys()];
  let start, dest;
  let attempts = 0;
  // Pick random start, run BFS to find candidates ≥3 away; retry up to 200 times
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
       (user_id, start_id, destination_id, score, completed_at)
     VALUES (?, ?, ?, ?, NULL)`
  ).run(req.user.id, start, dest, INITIAL_COINS);

  const gameId = result.lastInsertRowid;

  res.status(201).json(buildStartResponse(gameId, stationById(start), stationById(dest)));
});

// POST /api/games/:id/submit-route — validate route, apply random events, compute final score
router.post('/:id/submit-route',
  requireAuth,
  param('id').isInt({ min: 1 }).toInt(),
  body('segments').isArray({ min: 1 }),
  body('segments.*.station_a_id').isInt({ min: 1 }),
  body('segments.*.station_b_id').isInt({ min: 1 }),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

    const gameId           = req.params.id;
    const submittedSegments = req.body.segments;

    // Verify game exists, belongs to the current user, and is still open
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

    // Invalid route: zero score, mark complete, skip execution phase
    if (!valid) {
      db.prepare('UPDATE games SET score = 0, completed_at = ? WHERE id = ?')
        .run(new Date().toISOString(), gameId);
      return res.json(buildSubmitResponse({ valid: false, previousBest, improved: false }));
    }

    const allStations = new Map(
      db.prepare('SELECT id, name FROM stations').all().map(s => [s.id, { id: s.id, name: s.name }])
    );
    const events = db.prepare('SELECT * FROM events').all();
    const steps  = [];
    let coins      = INITIAL_COINS;
    let finalScore = 0;

    // One random event per segment; running total persisted atomically
    db.transaction(() => {
      for (let i = 0; i < submittedSegments.length; i++) {
        const seg   = submittedSegments[i];
        const event = events[Math.floor(Math.random() * events.length)];
        coins += event.effect; // running total may go negative; only the final score is clamped

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

      // Final score is the remaining coins, clamped to a minimum of 0
      finalScore = Math.max(0, coins);
      db.prepare('UPDATE games SET score = ?, completed_at = ? WHERE id = ?')
        .run(finalScore, new Date().toISOString(), gameId);
    })();

    const improved = finalScore > (previousBest ?? 0);
    return res.json(buildSubmitResponse({ valid: true, steps, finalScore, previousBest, improved }));
  }
);

export default router;
