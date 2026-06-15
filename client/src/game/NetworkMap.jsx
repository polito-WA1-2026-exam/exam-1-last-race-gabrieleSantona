import { Badge } from 'react-bootstrap';

// showLines=true → full diagram with colored line rows and interchange markers
// showLines=false → plain station name grid only
// Render metro network visualization: full diagram with lines or simplified station badges only
function NetworkMap({ network, stations, showLines, interchangeIds }) {
  if (showLines) {
    if (!network) return null;

    // Compute interchange ids from network data
    const stationLineCount = new Map();
    for (const line of network.lines) {
      for (const sid of line.stations) {
        stationLineCount.set(sid, (stationLineCount.get(sid) || 0) + 1);
      }
    }
    const interchanges = new Set(
      [...stationLineCount.entries()].filter(([, cnt]) => cnt > 1).map(([id]) => id)
    );
    const stationName = new Map(network.stations.map(s => [s.id, s.name]));

    return (
      <div className="network-map">
        {network.lines.map(line => (
          <div key={line.id} className="line-row mb-3">
            <div className="d-flex align-items-center mb-1">
              <span
                className="line-badge me-2"
                style={{ background: line.color, display: 'inline-block', width: 14, height: 14, borderRadius: 3 }}
              />
              <strong>{line.name}</strong>
            </div>
            <div className="d-flex align-items-center flex-wrap">
              {line.stations.map((sid, idx) => {
                const isInterchange = interchanges.has(sid);
                return (
                  <div key={sid} className="d-flex align-items-center">
                    <div
                      className="station-box px-2 py-1 text-center"
                      style={{
                        border: `2px solid ${isInterchange ? '#00ff41' : line.color}`,
                        borderRadius: 0,
                        background: '#1a1a2e',
                        minWidth: 100,
                        fontSize: 12,
                        fontWeight: isInterchange ? 700 : 400,
                        color: '#00ff41',
                      }}
                      title={isInterchange ? 'Interchange station' : ''}
                    >
                      {isInterchange && <span style={{ fontSize: 11, color: '#00ff41' }}>⬡ </span>}
                      {stationName.get(sid)}
                    </div>
                    {idx < line.stations.length - 1 && (
                      <div
                        style={{ width: 24, height: 4, background: line.color, flexShrink: 0 }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        <small className="text-muted">⬡ = interchange station (line change allowed here)</small>
      </div>
    );
  }

  // Planning mode: show station names only
  if (!stations) return null;
  const interchangeSet = new Set(interchangeIds || []);

  return (
    <div className="d-flex flex-wrap gap-2">
      {stations.map(s => (
        <Badge
          key={s.id}
          bg={interchangeSet.has(s.id) ? 'secondary' : 'light'}
          text={interchangeSet.has(s.id) ? 'white' : 'dark'}
          style={{ fontSize: 12, border: '1px solid #ccc', fontWeight: 400 }}
        >
          {s.name}
        </Badge>
      ))}
    </div>
  );
}

export default NetworkMap;
