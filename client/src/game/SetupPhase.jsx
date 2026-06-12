import { Container, Card, Button, Spinner } from 'react-bootstrap';
import NetworkMap from './NetworkMap.jsx';

function SetupPhase({ network, onReady }) {
  if (!network) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" />
        <p className="mt-2 text-muted">Loading network…</p>
      </div>
    );
  }

  return (
    <Container className="py-4">
      <h4 className="mb-1">Study the Metro Network</h4>
      <p className="text-muted mb-4">
        Memorise the lines and connections. During planning, the line info will be hidden.
      </p>

      <Card className="mb-4">
        <Card.Body>
          <NetworkMap network={network} showLines={true} />
        </Card.Body>
      </Card>

      <div className="text-center">
        <Button size="lg" variant="primary" onClick={onReady}>
          I'm Ready — Start Planning
        </Button>
      </div>
    </Container>
  );
}

export default SetupPhase;
