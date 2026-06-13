import { useState, useEffect } from 'react';
import { Container, Table, Spinner, Alert, Badge } from 'react-bootstrap';
import { getRanking } from '../api/api.js';

const MEDALS = ['🥇', '🥈', '🥉'];

function RankingPage() {
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    getRanking()
      .then(data => setRanking(data.ranking))
      .catch(err => setError(err.message || 'Could not load ranking.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Container className="py-5">
      <h2 className="mb-4 text-center text-dark">🏆 Global Ranking</h2>

      {loading && (
        <div className="text-center">
          <Spinner animation="border" />
        </div>
      )}

      {error && <Alert variant="danger">{error}</Alert>}

      {!loading && !error && ranking.length === 0 && (
        <p className="text-center text-muted">No games played yet.</p>
      )}

      {!loading && ranking.length > 0 && (
        <Table striped bordered hover className="mx-auto" style={{ maxWidth: 480 }}>
          <thead className="table-dark">
            <tr>
              <th>#</th>
              <th>Player</th>
              <th className="text-end">Best Score</th>
            </tr>
          </thead>
          <tbody>
            {ranking.map((entry, i) => (
              <tr key={entry.username}>
                <td>{MEDALS[i] ?? i + 1}</td>
                <td style={{ fontWeight: 'bold', color: '#ffd700' }}>{entry.username}</td>
                <td className="text-end">
                  <Badge bg="primary">{entry.best_score} coins</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </Container>
  );
}

export default RankingPage;
