import { useEffect } from 'react';
import { Container, Button, Card, Row, Col, Badge, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';

function HomePage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // Redirect logged-in users directly to the game
  useEffect(() => {
    if (user) navigate('/game', { replace: true });
  }, [user, navigate]);

  // While auth resolves or if user is logged in (redirect is pending), show nothing
  if (loading || user) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '60vh' }}>
        <Spinner animation="border" />
      </div>
    );
  }

  return (
    <Container className="py-5">
      <h1 className="text-center mb-2">Last Race</h1>
      <p className="text-center text-muted mb-5">Navigate the underground network before time runs out</p>

      <Row className="justify-content-center">
        <Col md={8}>
          <Card className="mb-4">
            <Card.Header><strong>How to Play</strong></Card.Header>
            <Card.Body>
              <p>You are assigned a <strong>starting station</strong> and a <strong>destination station</strong> in a fictional underground metro network. Your goal is to reach the destination with as many coins as possible.</p>

              <h6>Game Phases</h6>
              <ol>
                <li className="mb-2">
                  <strong>Setup</strong> — Study the full metro map: all lines, stations, and connections. When you're ready, start the game.
                </li>
                <li className="mb-2">
                  <strong>Planning <Badge bg="warning" text="dark">90 seconds</Badge></strong> — The map hides the line information. You see only station names and a list of all connected pairs. Build your route by selecting segments in order. Each segment can only be used once. Submit before time runs out — or the route you've built so far is submitted automatically.
                </li>
                <li className="mb-2">
                  <strong>Execution</strong> — Your route is validated. If valid, you travel segment by segment: a random event occurs on each leg, gaining or losing coins (–4 to +4). Invalid or incomplete routes score 0.
                </li>
                <li className="mb-2">
                  <strong>Result</strong> — Your final coin total is your score (minimum 0). Play again to beat your best!
                </li>
              </ol>

              <h6 className="mt-3">Route Rules</h6>
              <ul>
                <li>The route must start and end at the assigned stations.</li>
                <li>Each segment must belong to a real metro line.</li>
                <li>You can only change lines at <strong>interchange stations</strong> (served by 2+ lines).</li>
                <li>The same segment cannot be used more than once.</li>
              </ul>

              <p className="text-muted mb-0"><small>Each game starts with <strong>20 coins</strong>.</small></p>
            </Card.Body>
          </Card>

          {user ? (
            <div className="text-center">
              <Button size="lg" variant="primary" onClick={() => navigate('/game')}>
                Play Now
              </Button>
            </div>
          ) : (
            <Card className="border-primary">
              <Card.Body className="text-center">
                <p className="mb-3">Log in to play and appear in the ranking.</p>
                <Button variant="primary" onClick={() => navigate('/login')}>Login to Play</Button>
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>
    </Container>
  );
}

export default HomePage;
