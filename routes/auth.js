const express = require('express')
const { body } = require('express-validator')
const authController = require('../controllers/authController')
const validate = require('../middleware/validate')

const router = express.Router()

router.post('/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Enter a valid email address').normalizeEmail(),
    body('password').isLength({ min: 5 }).withMessage('Password must be at least 5 characters long')
  ],
  validate,
  authController.register
)

router.post('/login',
  [
    body('email').isEmail().withMessage('Enter a valid email address').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required')
  ],
  validate,
  authController.login
)

router.get('/vapid-key', authController.getVapidKey)
router.post('/subscribe', authController.subscribe)

module.exports = router
