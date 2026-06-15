import db from './db.js';

// Build in-memory network graph: adjacency, segment lines, real segments, interchanges on startup
function buildNetworkCache() {
  const rows = db.prepare(
    'SELECT line_id, station_id, position FROM line_stations ORDER BY line_id, position'
  ).all();

  // Group stations by line to construct line paths
  const byLine = new Map();
  for (const row of rows) {
    if (!byLine.has(row.line_id)) byLine.set(row.line_id, []);
    byLine.get(row.line_id).push(row.station_id);
  }

  const adjacency      = new Map();  // stationId → Set<stationId>: which stations are neighbors
  const segmentLines   = new Map();  // "min-max" → Set<lineId>: which lines serve each segment
  const stationLineMap = new Map();  // stationId → Set<lineId>: which lines pass through each station

  // Build adjacency from consecutive station pairs on each line
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

  // Interchanges are stations served by 2+ lines
  const realSegments   = new Set(segmentLines.keys());
  const interchangeSet = new Set(
    [...stationLineMap.entries()].filter(([, ls]) => ls.size > 1).map(([id]) => id)
  );

  return { adjacency, segmentLines, realSegments, interchangeSet, stationLineMap };
}

// Normalize segment direction: always min-max so (a,b) and (b,a) map to same key
export function segKey(a, b) {
  return `${Math.min(a, b)}-${Math.max(a, b)}`;
}

const cache = buildNetworkCache();
export const { adjacency, segmentLines, realSegments, interchangeSet, stationLineMap } = cache;

// Breadth-first search to compute minimum distance from start to all reachable stations
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

// Determine available lines after arriving at a station
export function nextLineIds(stationId, linesOfSegment) {
  // At interchange: can switch to any line; otherwise must stay on current line(s)
  if (interchangeSet.has(stationId)) {
    return new Set(stationLineMap.get(stationId));
  }
  return new Set(linesOfSegment);
}

// Find neighboring stations accessible via allowed lines and unused segments
export function getAvailableNeighbors(currentStationId, currentLineIds, usedSegmentKeys) {
  const neighbors = adjacency.get(currentStationId) || new Set();
  const available = [];
  for (const nb of neighbors) {
    const key = segKey(currentStationId, nb);
    if (usedSegmentKeys.has(key)) continue; // skip already-used segments
    if (currentLineIds === null) {
      available.push(nb); // first move: any adjacent station
    } else {
      // Check if segment is served by any of the allowed lines
      const linesForSeg = segmentLines.get(key) || new Set();
      const hasOverlap = [...currentLineIds].some(l => linesForSeg.has(l));
      if (hasOverlap) available.push(nb);
    }
  }
  return available;
}

// Validate entire route: starts/ends correctly, uses real segments, respects line changes, no duplicates
export function validateRoute(segments, startId, destId) {
  if (!segments || segments.length < 3) return false;
  let currentStation = startId;
  const usedSegments = new Set();
  let currentLines = null; // null until first move, then tracks allowed lines
  for (const seg of segments) {
    const { station_a_id: a, station_b_id: b } = seg;
    const key = segKey(a, b);
    if (!realSegments.has(key)) return false;
    if (usedSegments.has(key)) return false;
    usedSegments.add(key);
    // Ensure segment connects to current station
    let nextStation;
    if (currentStation === a) nextStation = b;
    else if (currentStation === b) nextStation = a;
    else return false;
    const linesForSeg = segmentLines.get(key);
    if (currentLines === null) {
      // First segment: establish which line(s) we're on
      currentLines = new Set(linesForSeg);
    } else {
      // Check if segment has overlap with current allowed lines
      const overlap = new Set([...currentLines].filter(l => linesForSeg.has(l)));
      if (overlap.size === 0) {
        // No overlap: only valid if at interchange (can switch lines)
        if (!interchangeSet.has(currentStation)) return false;
        currentLines = new Set(linesForSeg);
      } else {
        // Stay on overlapping line(s)
        currentLines = overlap;
      }
    }
    currentStation = nextStation;
  }
  return currentStation === destId;
}
