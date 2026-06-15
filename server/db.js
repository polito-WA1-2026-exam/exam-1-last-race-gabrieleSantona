import Database from 'better-sqlite3';
import bcrypt from 'bcrypt';

const db = new Database('./lastrace.db');
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT    NOT NULL UNIQUE,
    password TEXT    NOT NULL
  );

  CREATE TABLE IF NOT EXISTS lines (
    id    INTEGER PRIMARY KEY AUTOINCREMENT,
    name  TEXT    NOT NULL UNIQUE,
    color TEXT    NOT NULL
  );

  CREATE TABLE IF NOT EXISTS stations (
    id   INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT    NOT NULL UNIQUE
  );

  CREATE TABLE IF NOT EXISTS line_stations (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    line_id    INTEGER NOT NULL REFERENCES lines(id),
    station_id INTEGER NOT NULL REFERENCES stations(id),
    position   INTEGER NOT NULL,
    UNIQUE(line_id, position),
    UNIQUE(line_id, station_id)
  );

  CREATE TABLE IF NOT EXISTS events (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    description TEXT    NOT NULL,
    effect      INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS games (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id        INTEGER NOT NULL REFERENCES users(id),
    start_id       INTEGER NOT NULL REFERENCES stations(id),
    destination_id INTEGER NOT NULL REFERENCES stations(id),
    score          INTEGER NOT NULL DEFAULT 20,
    completed_at   TEXT
  );

  CREATE TABLE IF NOT EXISTS game_segments (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    game_id      INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    position     INTEGER NOT NULL,
    station_a_id INTEGER NOT NULL REFERENCES stations(id),
    station_b_id INTEGER NOT NULL REFERENCES stations(id),
    event_id     INTEGER REFERENCES events(id),
    coins_after  INTEGER
  );
`);

const seedNeeded = db.prepare('SELECT COUNT(*) as cnt FROM users').get().cnt === 0;

if (seedNeeded) {
  const insertLine    = db.prepare('INSERT INTO lines (name, color) VALUES (?, ?)');
  const insertStation = db.prepare('INSERT INTO stations (name) VALUES (?)');
  const insertLS      = db.prepare('INSERT INTO line_stations (line_id, station_id, position) VALUES (?, ?, ?)');
  const insertEvent   = db.prepare('INSERT INTO events (description, effect) VALUES (?, ?)');
  const insertUser    = db.prepare('INSERT INTO users (username, password) VALUES (?, ?)');
  const insertGame    = db.prepare(
    'INSERT INTO games (user_id, start_id, destination_id, score, completed_at) VALUES (?, ?, ?, ?, ?)'
  );

  db.transaction(() => {
    // Lines
    insertLine.run('Linea Rossa',   '#e63946');  // id 1
    insertLine.run('Linea Blu',     '#457b9d');  // id 2
    insertLine.run('Linea Verde',   '#2a9d8f');  // id 3
    insertLine.run('Linea Arancio', '#f4a261');  // id 4

    // Stations
    insertStation.run('Piazza Centrale');       // id 1  — interchange Rossa+Blu
    insertStation.run('Porta Vecchia');         // id 2
    insertStation.run("Fontana dell'Orso");     // id 3
    insertStation.run('Largo Medici');          // id 4
    insertStation.run('Castello Normanno');     // id 5  — interchange Rossa+Verde
    insertStation.run('Via dei Saraceni');      // id 6
    insertStation.run('Mercato del Pesce');     // id 7
    insertStation.run("Torre dell'Aquila");     // id 8  — interchange Blu+Arancio
    insertStation.run('Colosseo Minore');       // id 9
    insertStation.run('Basilica di San Rocco'); // id 10
    insertStation.run('Giardini Borromeo');     // id 11
    insertStation.run('Anfiteatro Romano');     // id 12 — interchange Verde+Arancio
    insertStation.run('Palazzo dei Dogi');      // id 13
    insertStation.run('Borgo Antico');          // id 14

    // Linea Rossa: 2→1→3→4→5
    insertLS.run(1, 2, 1); insertLS.run(1, 1, 2); insertLS.run(1, 3, 3);
    insertLS.run(1, 4, 4); insertLS.run(1, 5, 5);

    // Linea Blu: 1→6→7→8→9
    insertLS.run(2, 1, 1); insertLS.run(2, 6, 2); insertLS.run(2, 7, 3);
    insertLS.run(2, 8, 4); insertLS.run(2, 9, 5);

    // Linea Verde: 5→10→11→12
    insertLS.run(3, 5, 1); insertLS.run(3, 10, 2); insertLS.run(3, 11, 3);
    insertLS.run(3, 12, 4);

    // Linea Arancio: 8→13→14→12
    insertLS.run(4, 8, 1); insertLS.run(4, 13, 2); insertLS.run(4, 14, 3);
    insertLS.run(4, 12, 4);

    // Events — thematic underground travel incidents
    insertEvent.run('Line temporarily unavailable, arriving late', -2);
    insertEvent.run('You didn\'t buy a ticket: fine at next stop', -1);
    insertEvent.run('Driver strike: train canceled', -3);
    insertEvent.run('Technical fault at turnstiles, station delay', -2);
    insertEvent.run('Emergency in tunnel, train blocked 10 minutes', -4);
    insertEvent.run('No incidents: regular journey', 0);
    insertEvent.run('Found a monthly pass on the ground: lucky!', +2);
    insertEvent.run('Train ahead of schedule', +1);
    insertEvent.run('Direct connection without intermediate stops', +3);
    insertEvent.run('Free seat available, relaxing journey', +1);
    insertEvent.run('Wrong announcement: you got off at the right stop by luck', -1);
    insertEvent.run('Distracted conductor: you pass without a ticket', +4);

    // Users
    const hash = (pw) => bcrypt.hashSync(pw, 10);
    insertUser.run('marco',  hash('password123'));  // id 1
    insertUser.run('giulia', hash('sicura456'));    // id 2
    insertUser.run('luca',   hash('metro789'));     // id 3

    // Game history for marco: scores 15 and 8
    insertGame.run(1, 2, 8, 15, new Date('2026-05-10T14:30:00Z').toISOString());
    insertGame.run(1, 2, 4, 8,  new Date('2026-05-12T10:15:00Z').toISOString());

    // Game history for giulia: scores 22, 12, 5
    insertGame.run(2, 5, 9, 22, new Date('2026-05-08T09:00:00Z').toISOString());
    insertGame.run(2, 2, 9, 12, new Date('2026-05-14T16:45:00Z').toISOString());
    insertGame.run(2, 8, 5, 5,  new Date('2026-05-20T11:20:00Z').toISOString());
  })();
}

export default db;
