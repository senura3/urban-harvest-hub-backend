const express = require('express')
const { body } = require('express-validator')
const eventsController = require('../controllers/eventsController')
const { authMiddleware, adminOnly } = require('../middleware/authMiddleware')
const validate = require('../middleware/validate')

const router = express.Router()

router.get('/', eventsController.getEvents)
router.get('/:id', eventsController.getEventById)

// Protected Admin Actions
router.post('/',
  authMiddleware,
  adminOnly,
  [
    body('title').trim().notEmpty().withMessage('Event title is required'),
    body('date').notEmpty().withMessage('Date is required').isISO8601().withMessage('Date must be in a valid format'),
    body('location').trim().notEmpty().withMessage('Location is required'),
    body('category').trim().notEmpty().withMessage('Category is required'),
    body('imageUrl').isURL().withMessage('Image URL must be valid'),
    body('maxAttendees').isInt({ min: 1 }).withMessage('Capacity must be a positive integer'),
    body('latitude').isFloat().withMessage('Latitude must be a valid float coordinate'),
    body('longitude').isFloat().withMessage('Longitude must be a valid float coordinate')
  ],
  validate,
  eventsController.createEvent
)

router.put('/:id',
  authMiddleware,
  adminOnly,
  [
    body('title').trim().notEmpty().withMessage('Event title is required'),
    body('date').notEmpty().withMessage('Date is required').isISO8601().withMessage('Date must be in a valid format'),
    body('location').trim().notEmpty().withMessage('Location is required'),
    body('category').trim().notEmpty().withMessage('Category is required'),
    body('imageUrl').isURL().withMessage('Image URL must be valid'),
    body('maxAttendees').isInt({ min: 1 }).withMessage('Capacity must be a positive integer'),
    body('latitude').isFloat().withMessage('Latitude must be a valid float coordinate'),
    body('longitude').isFloat().withMessage('Longitude must be a valid float coordinate')
  ],
  validate,
  eventsController.updateEvent
)

router.delete('/:id',
  authMiddleware,
  adminOnly,
  eventsController.deleteEvent
)

module.exports = router
