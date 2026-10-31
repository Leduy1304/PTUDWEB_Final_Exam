/**
 * Admin-only guard. Must run AFTER the auth middleware (needs req.user).
 * Returns 403 for authenticated users who are not system administrators.
 */
module.exports = function requireAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ message: 'No token provided' });
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};
