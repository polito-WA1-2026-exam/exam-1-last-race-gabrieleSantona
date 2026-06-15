import { useState, useEffect } from 'react';
import { Alert, Spinner } from 'react-bootstrap';
import { getFullNetwork, getSegments, startGame, submitRoute } from '../api/api.js';
import SetupPhase from '../game/SetupPhase.jsx';
import PlanningPhase from '../game/PlanningPhase.jsx';
import ExecutionPhase from '../game/ExecutionPhase.jsx';
import ResultPhase from '../game/ResultPhase.jsx';

const INITIAL = {
  phase:        'setup',
  network:      null,
  segments:     null,
  interchanges: [],
  gameId:       null,
  start:        null,
  destination:  null,
  steps:        [],
  finalScore:   null,
  previousBest: null,
  improved:     false,
  invalidRoute: false,
  error:        '',
};

// Main game orchestrator: manage state across setup, planning, execution, and result phases
function GamePage() {
  const [state, setState] = useState(INITIAL);

  useEffect(() => {
    Promise.all([getFullNetwork(), getSegments()])
      .then(([networkData, segData]) =>
        setState(prev => ({
          ...prev,
          network:      networkData,
          segments:     segData.segments,
          interchanges: segData.interchanges,
        }))
      )
      .catch(err => setState(prev => ({ ...prev, error: err.message })));
  }, []);

  // Transition from setup to planning: request random start/destination pair from server
  async function handleReady() {
    setState(prev => ({ ...prev, error: '' }));
    try {
      const data = await startGame();
      setState(prev => ({
        ...prev,
        phase:       'planning',
        gameId:      data.gameId,
        start:       data.start,
        destination: data.destination,
      }));
    } catch (err) {
      setState(prev => ({ ...prev, error: err.message }));
    }
  }

// Submit planned route to server; branch to execution (valid) or result (invalid/incomplete)
  async function handleSubmitRoute(route) {
    setState(prev => ({ ...prev, error: '' }));
    try {
      const result = await submitRoute(state.gameId, route);
      if (!result.valid) {
        setState(prev => ({
          ...prev,
          phase:        'result',
          finalScore:   0,
          invalidRoute: true,
          improved:     false,
          previousBest: result.previousBest,
        }));
      } else {
        setState(prev => ({
          ...prev,
          phase:        'execution',
          steps:        result.steps,
          finalScore:   result.finalScore,
          improved:     result.improved,
          previousBest: result.previousBest,
        }));
      }
    } catch (err) {
      setState(prev => ({ ...prev, error: err.message }));
    }
  }

  // Transition from execution to result display after all segments revealed
  function handleFinish() {
    setState(prev => ({ ...prev, phase: 'result' }));
  }

// Reset game state to setup phase while preserving cached network and segment data
  function handlePlayAgain() {
    setState({
      ...INITIAL,
      network:      state.network,
      segments:     state.segments,
      interchanges: state.interchanges,
    });
  }

  const { phase, network, segments, interchanges, start, destination, steps, finalScore, previousBest, improved, invalidRoute, error } = state;

  if (error) return <Alert variant="danger" className="m-4">{error}</Alert>;

  if (!network) return <div className="text-center py-5"><Spinner animation="border" /></div>;

  if (phase === 'setup') {
    return <SetupPhase network={network} onReady={handleReady} />;
  }

  if (phase === 'planning') {
    return (
      <PlanningPhase
        stations={network.stations}
        segments={segments}
        interchanges={interchanges}
        start={start}
        destination={destination}
        onSubmit={handleSubmitRoute}
      />
    );
  }

  if (phase === 'execution') {
    return (
      <ExecutionPhase
        steps={steps}
        finalScore={finalScore}
        onFinish={handleFinish}
      />
    );
  }

  if (phase === 'result') {
    return (
      <ResultPhase
        score={finalScore}
        previousBest={previousBest}
        improved={improved}
        invalidRoute={invalidRoute}
        onPlayAgain={handlePlayAgain}
      />
    );
  }

  return <div className="text-center py-5"><Spinner animation="border" /></div>;
}

export default GamePage;
