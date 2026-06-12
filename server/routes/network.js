import { Router } from 'express';
import db from '../db.js';

const router = Router();

function requireAuth(req, res, next) {
  if (!req.isAuthenticated()) return res.status(401).json({ error: 'Not authenticated.' });
  next();
}

router.get('/full', requireAuth, (req, res) => {
  const stations = db.prepare('SELECT id, name FROM stations ORDER BY id').all();

  const lines = db.prepare('SELECT id, name, color FROM lines ORDER BY id').all();
  const lineStations = db.prepare(
    'SELECT line_id, station_id, position FROM line_stations ORDER BY line_id, position'
  ).all();

  // Group station ids and derive segments per line
  const byLine = new Map();
  for (const row of lineStations) {
    if (!byLine.has(row.line_id)) byLine.set(row.line_id, []);
    byLine.get(row.line_id).push(row.station_id);
  }

  const result = lines.map(line => {
    const stationIds = byLine.get(line.id) || [];
    const segments = [];
    for (let i = 0; i < stationIds.length - 1; i++) {
      segments.push({ station_a: stationIds[i], station_b: stationIds[i + 1] });
    }
    return { id: line.id, name: line.name, color: line.color, stations: stationIds, segments };
  });

  res.json({ stations, lines: result });
});

router.get('/segments', requireAuth, (req, res) => {
  const lineStations = db.prepare(
    'SELECT line_id, station_id, position FROM line_stations ORDER BY line_id, position'
  ).all();

  const stationMap = new Map(
    db.prepare('SELECT id, name FROM stations').all().map(s => [s.id, s.name])
  );

  const byLine = new Map();
  const stationLineCount = new Map();
  for (const row of lineStations) {
    if (!byLine.has(row.line_id)) byLine.set(row.line_id, []);
    byLine.get(row.line_id).push(row.station_id);
    if (!stationLineCount.has(row.station_id)) stationLineCount.set(row.station_id, new Set());
    stationLineCount.get(row.station_id).add(row.line_id);
  }

  const segLineMap = new Map();
  for (const [lineId, stationIds] of byLine) {
    for (let i = 0; i < stationIds.length - 1; i++) {
      const a = stationIds[i], b = stationIds[i + 1];
      const key = `${Math.min(a, b)}-${Math.max(a, b)}`;
      if (!segLineMap.has(key)) segLineMap.set(key, new Set());
      segLineMap.get(key).add(lineId);
    }
  }

  const seen = new Set();
  const segments = [];
  for (const stationIds of byLine.values()) {
    for (let i = 0; i < stationIds.length - 1; i++) {
      const a = stationIds[i];
      const b = stationIds[i + 1];
      const key = `${Math.min(a, b)}-${Math.max(a, b)}`;
      if (!seen.has(key)) {
        seen.add(key);
        segments.push({
          station_a_id:   a,
          station_a_name: stationMap.get(a),
          station_b_id:   b,
          station_b_name: stationMap.get(b),
          line_ids:       [...segLineMap.get(key)],
        });
      }
    }
  }

  const interchanges = [...stationLineCount.entries()]
    .filter(([, ls]) => ls.size > 1)
    .map(([id]) => id);

  res.json({ segments, interchanges });
});

router.get('/stations', requireAuth, (req, res) => {
  const stations = db.prepare('SELECT id, name FROM stations ORDER BY id').all();
  res.json({ stations });
});

export default router;
