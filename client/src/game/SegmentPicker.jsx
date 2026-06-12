import { ListGroup, Button, Badge, Alert } from 'react-bootstrap';

function segKey(a, b) {
  return `${Math.min(a, b)}-${Math.max(a, b)}`;
}

function routeTail(route, startId) {
  if (route.length === 0) return startId;
  let cur = startId;
  for (const seg of route) {
    cur = cur === seg.station_a_id ? seg.station_b_id : seg.station_a_id;
  }
  return cur;
}

// Walks the route and returns the set of line IDs valid at the tail station.
// Returns null when there is no restriction (start of route, or tail is an interchange).
function computeCurrentLineIds(route, startId, interchangeSet) {
  if (route.length === 0) return null;
  let cur = startId;
  let lineIds = null;
  for (const seg of route) {
    const next = cur === seg.station_a_id ? seg.station_b_id : seg.station_a_id;
    if (interchangeSet.has(next)) {
      lineIds = null;
    } else {
      lineIds = new Set(seg.line_ids);
    }
    cur = next;
  }
  return lineIds;
}

function SegmentPicker({ segments, route, onAdd, onRemoveLast, startId, destinationId, interchanges }) {
  const interchangeSet = new Set(interchanges);
  const usedKeys       = new Set(route.map(s => segKey(s.station_a_id, s.station_b_id)));
  const tail           = routeTail(route, startId);
  const currentLineIds = computeCurrentLineIds(route, startId, interchangeSet);

  function canAdd(seg) {
    if (usedKeys.has(segKey(seg.station_a_id, seg.station_b_id))) return false;
    const touchesTail = seg.station_a_id === tail || seg.station_b_id === tail;
    if (!touchesTail) return false;
    if (currentLineIds === null) return true;
    return seg.line_ids.some(lid => currentLineIds.has(lid));
  }

  function routeStationChain() {
    const chain = [startId];
    let cur = startId;
    for (const seg of route) {
      const next = cur === seg.station_a_id ? seg.station_b_id : seg.station_a_id;
      chain.push(next);
      cur = next;
    }
    return chain;
  }

  const stationName = new Map(
    segments.flatMap(s => [
      [s.station_a_id, s.station_a_name],
      [s.station_b_id, s.station_b_name],
    ])
  );

  const chain           = routeStationChain();
  const unusedSegments  = segments.filter(seg => !usedKeys.has(segKey(seg.station_a_id, seg.station_b_id)));

  return (
    <div>
      {/* Route chain display */}
      <div className="mb-3 p-2 bg-light rounded border">
        <small className="text-muted d-block mb-1">Your route:</small>
        <div className="d-flex flex-wrap align-items-center gap-1">
          {chain.map((sid, idx) => (
            <span key={idx} className="d-flex align-items-center">
              <Badge
                bg={
                  sid === destinationId && idx === chain.length - 1
                    ? 'success'
                    : idx === 0
                    ? 'primary'
                    : 'secondary'
                }
              >
                {stationName.get(sid) ?? `#${sid}`}
              </Badge>
              {idx < chain.length - 1 && <span className="mx-1 text-muted">→</span>}
            </span>
          ))}
          {route.length === 0 && (
            <span className="text-muted" style={{ fontSize: 13 }}>
              Select your first segment below
            </span>
          )}
        </div>
        {route.length > 0 && (
          <Button variant="outline-danger" size="sm" className="mt-2" onClick={onRemoveLast}>
            ↩ Remove last segment
          </Button>
        )}
      </div>

      {tail === destinationId && route.length > 0 && (
        <Alert variant="success" className="py-2">
          Route reaches the destination! Submit when ready.
        </Alert>
      )}

      {/* Segment list — used ones removed, valid ones highlighted */}
      <small className="text-muted d-block mb-1">
        Segments ({unusedSegments.length} remaining):
      </small>
      <div style={{ maxHeight: 300, overflowY: 'auto' }}>
        <ListGroup>
          {unusedSegments.map(seg => {
            const key     = segKey(seg.station_a_id, seg.station_b_id);
            const addable = canAdd(seg);
            return (
              <ListGroup.Item
                key={key}
                onClick={addable ? () => onAdd(seg) : undefined}
                className="d-flex justify-content-between align-items-center py-2"
                style={{
                  cursor:      addable ? 'pointer' : 'default',
                  opacity:     addable ? 1 : 0.3,
                  borderLeft:  addable ? '4px solid #198754' : '4px solid transparent',
                  background:  addable ? '#f0fff4' : undefined,
                  transition:  'background 0.15s',
                }}
              >
                <span style={{ fontSize: 13, fontWeight: addable ? 600 : 400, color: addable ? '#0f5132' : undefined }}>
                  {seg.station_a_name} — {seg.station_b_name}
                </span>
                {addable && (
                  <Badge bg="success" style={{ fontSize: 11 }}>+ Add</Badge>
                )}
              </ListGroup.Item>
            );
          })}
          {unusedSegments.length === 0 && (
            <ListGroup.Item className="text-muted" style={{ fontSize: 13 }}>
              All segments have been used.
            </ListGroup.Item>
          )}
        </ListGroup>
      </div>
    </div>
  );
}

export default SegmentPicker;
