// Block unauthenticated requests with 401 status; guard protected API endpoints
export function requireAuth(req, res, next) {
  if (!req.isAuthenticated()) return res.status(401).json({ error: 'Not authenticated.' });
  next();
}
