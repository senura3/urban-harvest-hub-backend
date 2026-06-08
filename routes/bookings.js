const express = require('express')
const { body } = require('express-validator')
const bookingsController = require('../controllers/bookingsController')
const { authMiddleware, adminOnly } = require('../middleware/authMiddleware')
const validate = require('../middleware/validate')

const router = express.Router()

// Authenticated Routes
router.use(authMiddleware)

router.post('/',
  [
    body('itemId').trim().notEmpty().withMessage('Item or Event ID is required'),
    body('date').notEmpty().withMessage('Preferred date is required').isISO8601().withMessage('Date must be in a valid format'),
    body('tickets').isInt({ min: 1 }).withMessage('Tickets count must be at least 1')
  ],
  validate,
  bookingsController.createBooking
)

router.get('/me', bookingsController.getBookings)

router.put('/:id',
  adminOnly,
  [
    body('status').isIn(['confirmed', 'cancelled']).withMessage('Invalid status')
  ],
  validate,
  bookingsController.updateBookingStatus
)

module.exports = router
