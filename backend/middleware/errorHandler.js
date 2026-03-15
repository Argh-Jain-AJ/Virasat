/**
 * Global Error Handler Middleware
 * Catches all unhandled errors in the application
 */
const errorHandler = (err, req, res, next) => {
  console.error('[Error Handler]:', err.message || err);

  const statusCode = err.statusCode || 500;
  const showStack = process.env.NODE_ENV === 'development';

  res.status(statusCode).json({
    error: true,
    message: err.message || 'Something went wrong',
    ...(showStack && { stack: err.stack }),
  });
};

module.exports = errorHandler;
