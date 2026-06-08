require('dotenv').config()
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const path = require('path')

const { connectDB } = require('./models/db')
const authRoutes = require('./routes/auth')
const itemRoutes = require('./routes/items')
const eventRoutes = require('./routes/events')
const bookingRoutes = require('./routes/bookings')
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler')

const app = express()
const PORT = process.env.PORT || 5000

// Security & Request parsing middleware
app.use(helmet({
  contentSecurityPolicy: false // Disable CSP so local development is easier for the SPA
}))

const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173'
app.use(cors({
  origin: [clientUrl, 'http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true
}))

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// API Routes
app.use('/api/auth', authRoutes)
app.use('/api/items', itemRoutes)
app.use('/api/events', eventRoutes)
app.use('/api/bookings', bookingRoutes)

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development'
  })
})

// Serve static assets if running in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')))
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../dist', 'index.html'))
  })
}

// 404 handler
app.use(notFoundHandler)

// Centralized error handler middleware
app.use(errorHandler)

// Start Server
const startServer = async () => {
  try {
    await connectDB()
    app.listen(PORT, () => {
      console.log(`===========================================`)
      console.log(`Urban Harvest Hub Backend running on port ${PORT}`)
      console.log(`API URL: http://localhost:${PORT}/api`)
      console.log(`CORS allowed URL: ${clientUrl}`)
      console.log(`===========================================`)
    })
  } catch (err) {
    console.error("Critical: Express failed to start due to database errors.", err)
    process.exit(1)
  }
}

startServer()
