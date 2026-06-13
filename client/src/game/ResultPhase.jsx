import { useState, useEffect } from 'react';
import { Container, Card, Button, Badge, Table, Spinner } from 'react-bootstrap';
import { getRanking } from '../api/api.js';
import { MEDALS } from '../api/models.js';

function ResultPhase({ score, previousBest, improved, invalidRoute, onPlayAgain }) {
  const [ranking, setRanking]   = useState([]);
  const [loadingRank, setLoadingRank] = useState(false);

  useEffect(() => {
    if (improved) {
      setLoadingRank(true);
      getRanking()
        .then(d => setRanking(d.ranking))
        .catch(() => {})
        .finally(() => setLoadingRank(false));
    }
  }, [improved]);

  if (improved) {
    return (
      <Container className="py-5" style={{ maxWidth: 560 }}>
        {/* Victory banner */}
        <Card className="text-center retro-victory-card mb-4">
          <Card.Body className="py-5">
            <div style={{ fontSize: 72 }}>🏆</div>
            <h2 className="mt-3 fw-bold" style={{ color: 'var(--neon-cyan)' }}>New Personal Best!</h2>
            <p className="text-muted mb-4">You smashed your previous record.</p>

            <div className="d-flex justify-content-center align-items-center gap-4 mb-4 flex-wrap">
              {previousBest !== null && (
                <div className="text-center">
                  <small className="text-muted d-block">Previous best</small>
                  <Badge bg="secondary" style={{ fontSize: 18 }}>{previousBest} coins</Badge>
                </div>
              )}
              {previousBest !== null && <span style={{ fontSize: 24 }}>→</span>}
              <div className="text-center">
                <small className="text-muted d-block">{previousBest !== null ? 'New best' : 'First score'}</small>
                <Badge bg="warning" text="dark" style={{ fontSize: 22 }}>{score} coins</Badge>
              </div>
            </div>
          </Card.Body>
        </Card>

        {/* Leaderboard */}
        <Card className="mb-4">
          <Card.Header><strong>🌍 Global Ranking</strong></Card.Header>
          <Card.Body className="p-0">
            {loadingRank ? (
              <div className="text-center py-3"><Spinner animation="border" size="sm" /></div>
            ) : ranking.length === 0 ? (
              <p className="text-muted text-center py-3 mb-0">No scores yet.</p>
            ) : (
              <Table className="mb-0" hover>
                <thead className="table-dark">
                  <tr>
                    <th>#</th>
                    <th>Player</th>
                    <th className="text-end">Best Score</th>
                  </tr>
                </thead>
                <tbody>
                  {ranking.map((entry, i) => (
                    <tr key={entry.username} className={entry.best_score === score ? 'table-warning fw-bold' : ''}>
                      <td>{MEDALS[i] ?? i + 1}</td>
                      <td>{entry.username}</td>
                      <td className="text-end">
                        <Badge bg="warning" text="dark">{entry.best_score} coins</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card.Body>
        </Card>

        <div className="text-center">
          <Button size="lg" variant="primary" onClick={onPlayAgain}>
            Play Again — Back to Map
          </Button>
        </div>
      </Container>
    );
  }

  // Normal result (no improvement, or invalid route)
  const emoji = invalidRoute ? '❌' : score >= 18 ? '🎉' : score > 0 ? '👍' : '😔';

  return (
    <Container className="d-flex justify-content-center align-items-center py-5">
      <Card style={{ maxWidth: 420, width: '100%' }} className="text-center">
        <Card.Body className="py-5">
          <div style={{ fontSize: 64 }}>{emoji}</div>
          <h3 className="mt-3 mb-1">{invalidRoute ? 'Invalid Route!' : 'Journey Complete!'}</h3>
          <p className="text-muted mb-4">
            {invalidRoute
              ? 'Your route was invalid or incomplete. All coins lost.'
              : 'You reached your destination.'}
          </p>

          <h4 className="mb-2">
            Final Score:{' '}
            <Badge bg={score > 0 ? 'primary' : 'secondary'} style={{ fontSize: 22 }}>
              {score} coins
            </Badge>
          </h4>

          {!invalidRoute && previousBest !== null && (
            <p className="text-muted mb-4" style={{ fontSize: 14 }}>
              Your best: {previousBest} coins
            </p>
          )}
          {!invalidRoute && previousBest === null && (
            <p className="text-muted mb-4" style={{ fontSize: 14 }}>
              This was your first game!
            </p>
          )}
          {invalidRoute && <div className="mb-4" />}

          <Button size="lg" variant="primary" onClick={onPlayAgain}>
            Play Again
          </Button>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default ResultPhase;
