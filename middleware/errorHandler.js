// Catch-all Express Error Handler
const errorHandler = (err, req, res, next) => {
  console.error("Unhandled server error:", err)

  const statusCode = err.statusCode || 500
  const message = err.message || 'An unexpected server error occurred'

  res.status(statusCode).json({
    error: err.name || 'ServerError',
    message: message
  })
}

// 404 Route Handler
const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    error: 'NotFoundError',
    message: `Resource not found - ${req.originalUrl}`
  })
}

module.exports = {
  errorHandler,
  notFoundHandler
}
