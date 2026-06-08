const express = require('express')
const { body } = require('express-validator')
const itemsController = require('../controllers/itemsController')
const { authMiddleware, adminOnly } = require('../middleware/authMiddleware')
const validate = require('../middleware/validate')

const router = express.Router()

router.get('/', itemsController.getItems)
router.get('/:id', itemsController.getItemById)

// Protected Admin Actions
router.post('/',
  authMiddleware,
  adminOnly,
  [
    body('name').trim().notEmpty().withMessage('Item name is required'),
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('category').isIn(['food', 'lifestyle', 'education', 'garden']).withMessage('Invalid category'),
    body('type').isIn(['product', 'workshop']).withMessage('Invalid type'),
    body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    body('availability').isInt({ min: 0 }).withMessage('Availability must be a positive integer'),
    body('imageUrl').isURL().withMessage('Image URL must be valid')
  ],
  validate,
  itemsController.createItem
)

router.put('/:id',
  authMiddleware,
  adminOnly,
  [
    body('name').trim().notEmpty().withMessage('Item name is required'),
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('category').isIn(['food', 'lifestyle', 'education', 'garden']).withMessage('Invalid category'),
    body('type').isIn(['product', 'workshop']).withMessage('Invalid type'),
    body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    body('availability').isInt({ min: 0 }).withMessage('Availability must be a positive integer'),
    body('imageUrl').isURL().withMessage('Image URL must be valid')
  ],
  validate,
  itemsController.updateItem
)

router.delete('/:id',
  authMiddleware,
  adminOnly,
  itemsController.deleteItem
)

module.exports = router
// Comment
