/** Central error handler — always returns JSON, never leaks stack traces. */
module.exports = function errorHandler(err, req, res, next) {
  console.error(err);
  const status = err.statusCode || 500;
  res.status(status).json({ message: err.message || 'Internal server error' });
};
