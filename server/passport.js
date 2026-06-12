import { Strategy as LocalStrategy } from 'passport-local';
import bcrypt from 'bcrypt';
import db from './db.js';

export default function configurePassport(passport) {
  passport.use(new LocalStrategy(async function verify(username, password, cb) {
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    if (!user) return cb(null, false, 'Incorrect username or password.');
    const match = await bcrypt.compare(password, user.password);
    if (!match) return cb(null, false, 'Incorrect username or password.');
    return cb(null, { id: user.id, username: user.username });
  }));

  // Store the whole user object in the session (no DB lookup on each request)
  passport.serializeUser((user, cb) => cb(null, user));
  passport.deserializeUser((user, cb) => cb(null, user));
}
