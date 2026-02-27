// backend/middleware/errorHandler.js
// Global error handling middleware

const errorHandler = (err, req, res, next) => {
  console.error('Global Error:', err.stack);

  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    // Only show stack trace in development
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};

module.exports = errorHandler;
