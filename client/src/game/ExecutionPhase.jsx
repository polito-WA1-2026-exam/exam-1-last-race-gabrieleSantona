import { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Card, Button, Badge, ListGroup } from 'react-bootstrap';

function effectLabel(effect) {
  if (effect > 0) return <Badge bg="success">+{effect} coins</Badge>;
  if (effect < 0) return <Badge bg="danger">{effect} coins</Badge>;
  return <Badge bg="secondary">±0 coins</Badge>;
}

function ExecutionPhase({ steps, finalScore, onFinish }) {
  const [revealed, setRevealed] = useState(0);
  const logEndRef = useRef(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [revealed]);

  function handleNext() {
    if (revealed < steps.length) setRevealed(r => r + 1);
  }

  const currentStep = steps[revealed - 1] ?? null;
  const done        = revealed === steps.length;
  const coins       = currentStep?.coins_after ?? 20;

  return (
    <Container className="py-4" style={{ maxWidth: 820 }}>
      <h4 className="mb-4">Journey Execution</h4>

      <Row className="align-items-stretch" style={{ minHeight: 360 }}>

        {/* Left — scrollable step log */}
        <Col xs={4} className="mb-3">
          <Card className="h-100">
            <Card.Header>
              <small className="fw-semibold text-muted">Travel log</small>
            </Card.Header>
            <div style={{ overflowY: 'auto', maxHeight: 360 }}>
              <ListGroup variant="flush">
                {revealed === 0 && (
                  <ListGroup.Item className="text-muted" style={{ fontSize: 12 }}>
                    Steps will appear here…
                  </ListGroup.Item>
                )}
                {steps.slice(0, revealed).map((step, idx) => (
                  <ListGroup.Item key={idx} className="py-2 px-3">
                    <div style={{ fontSize: 12, fontWeight: 600 }}>
                      {step.station_a.name} → {step.station_b.name}
                    </div>
                    <div className="d-flex justify-content-between align-items-center mt-1">
                      {effectLabel(step.event.effect)}
                      <span className="text-muted" style={{ fontSize: 11 }}>{step.coins_after} coins</span>
                    </div>
                  </ListGroup.Item>
                ))}
                <div ref={logEndRef} />
              </ListGroup>
            </div>
          </Card>
        </Col>

        {/* Center — current score + latest event */}
        <Col xs={8} className="mb-3 d-flex flex-column">
          <Card className="flex-grow-1 text-center d-flex flex-column justify-content-center">
            <Card.Body className="py-5">

              {/* Coin total */}
              <div className="mb-4">
                <small className="text-muted d-block mb-1">Coins</small>
                <span
                  className={coins > 20 ? 'text-success' : coins < 20 ? 'text-danger' : 'text-info'}
                  style={{
                    fontSize: 64,
                    fontWeight: 700,
                    lineHeight: 1,
                    textShadow: '0 0 12px currentColor',
                  }}
                >
                  {coins}
                </span>
              </div>

              {/* Latest event */}
              {currentStep && (
                <div
                  className="retro-event-box mx-auto p-3"
                  style={{ maxWidth: 340 }}
                >
                  <div className="fw-semibold mb-1" style={{ fontSize: 14 }}>
                    {currentStep.station_a.name} → {currentStep.station_b.name}
                  </div>
                  <div className="text-muted mb-2" style={{ fontSize: 13 }}>
                    {currentStep.event.description}
                  </div>
                  {effectLabel(currentStep.event.effect)}
                </div>
              )}

              {revealed === 0 && (
                <p className="text-muted mb-0">Press Start to begin the journey.</p>
              )}

              {/* Action button */}
              <div className="mt-4">
                {!done ? (
                  <Button variant="primary" size="lg" onClick={handleNext}>
                    {revealed === 0 ? 'Start Journey ▶' : `Next Segment → (${revealed}/${steps.length})`}
                  </Button>
                ) : (
                  <Button variant="success" size="lg" onClick={onFinish}>
                    See Result
                  </Button>
                )}
              </div>

            </Card.Body>
          </Card>
        </Col>

      </Row>
    </Container>
  );
}

export default ExecutionPhase;
