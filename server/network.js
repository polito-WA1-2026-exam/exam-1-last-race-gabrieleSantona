import db from './db.js';

function buildNetworkCache() {
  const rows = db.prepare(
    'SELECT line_id, station_id, position FROM line_stations ORDER BY line_id, position'
  ).all();

  const byLine = new Map();
  for (const row of rows) {
    if (!byLine.has(row.line_id)) byLine.set(row.line_id, []);
    byLine.get(row.line_id).push(row.station_id);
  }

  const adjacency      = new Map();  // stationId → Set<stationId>
  const segmentLines   = new Map();  // "min-max" → Set<lineId>
  const stationLineMap = new Map();  // stationId → Set<lineId>

  for (const [lineId, stations] of byLine) {
    for (const sid of stations) {
      if (!stationLineMap.has(sid)) stationLineMap.set(sid, new Set());
      stationLineMap.get(sid).add(lineId);
    }
    for (let i = 0; i < stations.length - 1; i++) {
      const a = stations[i], b = stations[i + 1];
      const key = segKey(a, b);
      if (!adjacency.has(a)) adjacency.set(a, new Set());
      if (!adjacency.has(b)) adjacency.set(b, new Set());
      adjacency.get(a).add(b);
      adjacency.get(b).add(a);
      if (!segmentLines.has(key)) segmentLines.set(key, new Set());
      segmentLines.get(key).add(lineId);
    }
  }

  const realSegments   = new Set(segmentLines.keys());
  const interchangeSet = new Set(
    [...stationLineMap.entries()].filter(([, ls]) => ls.size > 1).map(([id]) => id)
  );

  return { adjacency, segmentLines, realSegments, interchangeSet, stationLineMap };
}

export function segKey(a, b) {
  return `${Math.min(a, b)}-${Math.max(a, b)}`;
}

const cache = buildNetworkCache();
export const { adjacency, segmentLines, realSegments, interchangeSet, stationLineMap } = cache;

export function bfs(startId) {
  const dist = new Map([[startId, 0]]);
  const queue = [startId];
  while (queue.length) {
    const cur = queue.shift();
    for (const nb of (adjacency.get(cur) || [])) {
      if (!dist.has(nb)) { dist.set(nb, dist.get(cur) + 1); queue.push(nb); }
    }
  }
  return dist;
}

// Returns Set of line IDs available after arriving at `stationId` via a segment on `linesOfSegment`
export function nextLineIds(stationId, linesOfSegment) {
  if (interchangeSet.has(stationId)) {
    // At interchange: free to use any line serving this station
    return new Set(stationLineMap.get(stationId));
  }
  return new Set(linesOfSegment);
}

// Returns array of station IDs reachable in one move from currentStationId
// currentLineIds: null = any line (start of game), Set otherwise
// usedSegmentKeys: Set of "min-max" already used
export function getAvailableNeighbors(currentStationId, currentLineIds, usedSegmentKeys) {
  const neighbors = adjacency.get(currentStationId) || new Set();
  const available = [];
  for (const nb of neighbors) {
    const key = segKey(currentStationId, nb);
    if (usedSegmentKeys.has(key)) continue;
    if (currentLineIds === null) {
      available.push(nb); // first move: any line
    } else {
      const linesForSeg = segmentLines.get(key) || new Set();
      const hasOverlap = [...currentLineIds].some(l => linesForSeg.has(l));
      if (hasOverlap) available.push(nb);
    }
  }
  return available;
}

// Legacy: full route validation (kept for reference, not used in new flow)
export function validateRoute(segments, startId, destId) {
  if (!segments || segments.length < 3) return false;
  let currentStation = startId;
  const usedSegments = new Set();
  let currentLines = null;
  for (const seg of segments) {
    const { station_a_id: a, station_b_id: b } = seg;
    const key = segKey(a, b);
    if (!realSegments.has(key)) return false;
    if (usedSegments.has(key)) return false;
    usedSegments.add(key);
    let nextStation;
    if (currentStation === a) nextStation = b;
    else if (currentStation === b) nextStation = a;
    else return false;
    const linesForSeg = segmentLines.get(key);
    if (currentLines === null) {
      currentLines = new Set(linesForSeg);
    } else {
      const overlap = new Set([...currentLines].filter(l => linesForSeg.has(l)));
      if (overlap.size === 0) {
        if (!interchangeSet.has(currentStation)) return false;
        currentLines = new Set(linesForSeg);
      } else {
        currentLines = overlap;
      }
    }
    currentStation = nextStation;
  }
  return currentStation === destId;
}
