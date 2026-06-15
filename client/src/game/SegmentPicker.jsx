import { ListGroup, Button, Badge } from 'react-bootstrap';

// Normalize segment key so (a,b) and (b,a) produce same string; prevents duplicate segment usage
function segKey(a, b) {
  return `${Math.min(a, b)}-${Math.max(a, b)}`;
}

// UI to build a route by selecting segments sequentially; show unused segments and current station chain
function SegmentPicker({ segments, route, onAdd, onRemoveLast, startId, destinationId }) {
  // Track which segments are already in the route (prevent reuse)
  const usedKeys = new Set(route.map(s => segKey(s.station_a_id, s.station_b_id)));

  // Determine which station route currently ends at; used to validate next segment connection
  function currentTail() {
    if (route.length === 0) return startId;
    let cur = startId;
    for (const seg of route) {
      cur = cur === seg.station_a_id ? seg.station_b_id : seg.station_a_id;
    }
    return cur;
  }

  // Verify segment hasn't been used already in the current route
  function canAdd(seg) {
    return !usedKeys.has(segKey(seg.station_a_id, seg.station_b_id));
  }

// Construct ordered list of stations from start through all selected route segments
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
  const tail            = currentTail();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      {/* Route chain display */}
      <div className="segment-picker-route mb-3 p-2" style={{ flexShrink: 0 }}>
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

      {/* Segment list */}
      <div style={{ flexShrink: 0, marginBottom: '0.5rem' }}>
        <small className="text-muted d-block">
          Segments ({unusedSegments.length} remaining):
        </small>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
        <ListGroup>
          {unusedSegments.map(seg => {
            const key = segKey(seg.station_a_id, seg.station_b_id);
            const [leftName, rightName] =
              tail === seg.station_a_id
                ? [seg.station_a_name, seg.station_b_name]
                : tail === seg.station_b_id
                ? [seg.station_b_name, seg.station_a_name]
                : [seg.station_a_name, seg.station_b_name];

            return (
              <ListGroup.Item
                key={key}
                onClick={() => onAdd(seg)}
                className="d-flex justify-content-between align-items-center py-2"
                style={{ cursor: 'pointer', fontSize: 13 }}
              >
                <span>{leftName} — {rightName}</span>
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
