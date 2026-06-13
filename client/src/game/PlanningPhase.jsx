import { useState, useRef } from 'react';
import { Container, Row, Col, Card, Button, Badge } from 'react-bootstrap';
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
    <Container className="py-4">
      <Row className="mb-3 align-items-center">
        <Col>
          <h4 className="mb-0">Plan Your Route</h4>
        </Col>
        <Col md={4}>
          <Timer duration={90} onExpire={handleExpire} />
        </Col>
      </Row>

      <Row className="mb-3">
        <Col>
          <Card body className="d-flex gap-4 flex-wrap">
            <div>
              <small className="text-muted d-block">From</small>
              <Badge bg="primary" style={{ fontSize: 14 }}>{start.name}</Badge>
            </div>
            <div>
              <small className="text-muted d-block">To</small>
              <Badge bg="success" style={{ fontSize: 14 }}>{destination.name}</Badge>
            </div>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col md={4} className="mb-3">
          <Card>
            <Card.Header><strong>Stations</strong></Card.Header>
            <Card.Body>
              <p className="text-muted" style={{ fontSize: 12 }}>No line info shown during planning.</p>
              <NetworkMap stations={stations} showLines={false} interchangeIds={interchanges} />
            </Card.Body>
          </Card>
        </Col>

        <Col md={8}>
          <Card>
            <Card.Header><strong>Build Your Route</strong></Card.Header>
            <Card.Body>
              <SegmentPicker
                segments={segments}
                route={route}
                onAdd={handleAdd}
                onRemoveLast={handleRemoveLast}
                startId={start.id}
                destinationId={destination.id}
              />
              <div className="text-end mt-3">
                <Button variant="success" onClick={handleSubmit}>
                  Submit Route ({route.length} segment{route.length !== 1 ? 's' : ''})
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default PlanningPhase;
