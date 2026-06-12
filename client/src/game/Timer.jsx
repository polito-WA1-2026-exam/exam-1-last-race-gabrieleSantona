import { useState, useEffect, useRef } from 'react';
import { ProgressBar } from 'react-bootstrap';

function Timer({ duration, onExpire }) {
  const [timeLeft, setTimeLeft] = useState(duration);
  // Keep a ref to the latest onExpire so the effect never captures a stale version
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  useEffect(() => {
    if (timeLeft <= 0) {
      onExpireRef.current();
      return;
    }
    const id = setInterval(() => setTimeLeft(t => t - 1), 1000);
    return () => clearInterval(id);
  }, [timeLeft]);

  const pct     = Math.round((timeLeft / duration) * 100);
  const variant = pct > 50 ? 'success' : pct > 20 ? 'warning' : 'danger';
  const mins    = String(Math.floor(timeLeft / 60)).padStart(2, '0');
  const secs    = String(timeLeft % 60).padStart(2, '0');

  return (
    <div>
      <div className="d-flex justify-content-between mb-1">
        <small className="text-muted">Time remaining</small>
        <strong className={pct <= 20 ? 'text-danger' : ''}>{mins}:{secs}</strong>
      </div>
      <ProgressBar now={pct} variant={variant} style={{ height: 8 }} />
    </div>
  );
}

export default Timer;
