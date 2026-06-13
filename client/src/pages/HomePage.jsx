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
      <h1 className="text-center mb-2 fw-bold text-dark">🚇 Last Race</h1>
      <p className="text-center mb-4">Navigate the underground network before time runs out</p>

      <Row className="justify-content-center">
        <Col md={8}>
          {!user ? (
            <div className="text-center mb-4">
              <Button variant="primary" size="lg" onClick={() => navigate('/login')}>Login to Play</Button>
            </div>
          ) : null}

          <Card className="mb-4">
            <Card.Header><strong>🗺️ How to Play</strong></Card.Header>
            <Card.Body>
              <p>You are assigned a <strong>starting station</strong> and a <strong>destination station</strong> in a fictional underground metro network. Your goal is to reach the destination with as many coins as possible.</p>

              <h6>Game Phases</h6>
              <ol>
                <li className="mb-2">
                  <Badge bg="secondary" className="me-2">Setup</Badge> — Study the full metro map: all lines, stations, and connections. When you're ready, start the game.
                </li>
                <li className="mb-2">
                  <Badge bg="primary" className="me-2">Planning</Badge> — The map hides the line information. You see only station names and a list of all connected pairs. Build your route by selecting segments in order. Each segment can only be used once. Submit before time runs out — or the route you've built so far is submitted automatically.
                </li>
                <li className="mb-2">
                  <Badge bg="primary" className="me-2">Execution</Badge> — Your route is validated. If valid, you travel segment by segment: a random event occurs on each leg, gaining or losing coins (–4 to +4). Invalid or incomplete routes score 0.
                </li>
                <li className="mb-2">
                  <Badge bg="success" className="me-2">Result</Badge> — Your final coin total is your score (minimum 0). Play again to beat your best!
                </li>
              </ol>

              <h6 className="mt-3">Route Rules</h6>
              <ul className="list-unstyled">
                <li className="mb-2">✔ The route must start and end at the assigned stations.</li>
                <li className="mb-2">✔ Each segment must belong to a real metro line.</li>
                <li className="mb-2">✔ You can only change lines at <strong>interchange stations</strong> (served by 2+ lines).</li>
                <li className="mb-2">✔ The same segment cannot be used more than once.</li>
              </ul>

              <p className="mb-0"><small>Each game starts with <Badge bg="primary">20 coins</Badge>.</small></p>
            </Card.Body>
          </Card>

          {user && (
            <div className="text-center">
              <Button size="lg" variant="primary" onClick={() => navigate('/game')}>
                Play Now
              </Button>
            </div>
          )}
        </Col>
      </Row>
    </Container>
  );
}

export default HomePage;
