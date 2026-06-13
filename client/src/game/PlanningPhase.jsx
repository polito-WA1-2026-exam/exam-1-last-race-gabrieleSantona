import { useState, useRef } from 'react';
import { Card, Button, Badge } from 'react-bootstrap';
import Timer from './Timer.jsx';
import NetworkMap from './NetworkMap.jsx';
import SegmentPicker from './SegmentPicker.jsx';

function PlanningPhase({ stations, segments, interchanges, start, destination, onSubmit }) {
  const [route, setRoute] = useState([]);
  const submittedRef = useRef(false);

  function handleAdd(seg) {
    setRoute(prev => [...prev, seg]);
  }

  function handleRemoveLast() {
    setRoute(prev => prev.slice(0, -1));
  }

  function handleSubmit() {
    if (submittedRef.current) return;
    submittedRef.current = true;
    onSubmit(route);
  }

  function handleExpire() {
    if (submittedRef.current) return;
    submittedRef.current = true;
    onSubmit(route);
  }

  return (
    <div style={{ height: 'calc(100dvh - 56px)', display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '12px 16px', textAlign: 'left' }}>
      {/* Header row */}
      <div className="d-flex align-items-center mb-2" style={{ justifyContent: 'space-between' }}>
        <h4 className="mb-0">Plan Your Route</h4>
        <div style={{ width: 280 }}>
          <Timer duration={90} onExpire={handleExpire} />
        </div>
      </div>

      {/* Main content area */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', gap: '12px' }}>
        {/* Left side: From/To and Stations */}
        <div style={{ width: '25%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* From/To block */}
          <Card body className="py-2">
            <div className="mb-2">
              <small className="text-muted d-block">From</small>
              <Badge bg="primary" style={{ fontSize: 14 }}>{start.name}</Badge>
            </div>
            <div>
              <small className="text-muted d-block">To</small>
              <Badge bg="success" style={{ fontSize: 14 }}>{destination.name}</Badge>
            </div>
          </Card>

          {/* Stations card */}
          <Card style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <Card.Header><strong>Stations</strong></Card.Header>
            <Card.Body style={{ flex: 1, overflow: 'hidden', overflowY: 'auto' }}>
              <p className="text-muted" style={{ fontSize: 12 }}>No line info shown during planning.</p>
              <NetworkMap stations={stations} showLines={false} interchangeIds={interchanges} />
            </Card.Body>
          </Card>
        </div>

        {/* Right side: Route builder card */}
        <Card style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <Card.Header><strong>Build Your Route</strong></Card.Header>
          <Card.Body style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <SegmentPicker
              segments={segments}
              route={route}
              onAdd={handleAdd}
              onRemoveLast={handleRemoveLast}
              startId={start.id}
              destinationId={destination.id}
            />
          </Card.Body>
          <Card.Footer className="text-end">
            <Button variant="success" onClick={handleSubmit}>
              Submit Route ({route.length} segment{route.length !== 1 ? 's' : ''})
            </Button>
          </Card.Footer>
        </Card>
      </div>
    </div>
  );
}

export default PlanningPhase;
