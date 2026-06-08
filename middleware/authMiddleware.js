const jwt = require('jsonwebtoken')

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Access denied. Authorization token missing or malformed.'
    })
  }

  const token = authHeader.split(' ')[1]
  try {
    const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_eco_key_harvest_hub_development'
    const decoded = jwt.verify(token, JWT_SECRET)
    req.user = decoded
    next()
  } catch (error) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or expired authorization token.'
    })
  }
}

// Middleware to assert admin role validation
const adminOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'User authentication required.'
    })
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Access denied. Administrator privileges required.'
    })
  }
  
  next()
}

module.exports = {
  authMiddleware,
  adminOnly
}
