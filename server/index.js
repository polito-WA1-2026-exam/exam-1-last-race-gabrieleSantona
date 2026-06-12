import http from 'http';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import session from 'express-session';
import passport from 'passport';

import './db.js';
import configurePassport from './passport.js';
import authRouter from './routes/auth.js';
import networkRouter from './routes/network.js';
import gameRouter from './routes/game.js';
import rankingRouter from './routes/ranking.js';

const app = express();
const port = 3001;

app.use(express.json());
app.use(morgan('dev'));
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));

configurePassport(passport);

app.use(session({
  secret: 'lastrace-secret-key',
  resave: false,
  saveUninitialized: false,
}));
app.use(passport.authenticate('session'));

app.use('/api/sessions', authRouter);
app.use('/api/network',  networkRouter);
app.use('/api/games',    gameRouter);
app.use('/api/ranking',  rankingRouter);

app.use((err, req, res, next) => {
  const status = err.status || 500;
  res.status(status).json({ error: err.message || 'Internal server error' });
});

http.createServer(app).listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
