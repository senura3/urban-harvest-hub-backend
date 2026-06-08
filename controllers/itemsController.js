const Item = require('../models/Item')

const getItems = async (req, res, next) => {
  const { category, search, type } = req.query
  try {
    const items = await Item.find({ category, search, type })
    res.json(items)
  } catch (err) {
    next(err)
  }
}

const getItemById = async (req, res, next) => {
  const { id } = req.params
  try {
    const item = await Item.findById(id)
    if (!item) {
      return res.status(404).json({ error: 'NotFoundError', message: 'Item not found.' })
    }
    res.json(item)
  } catch (err) {
    next(err)
  }
}

const createItem = async (req, res, next) => {
  const { name, description, category, type, price, availability, imageUrl, date, location } = req.body
  try {
    const item = await Item.create({
      name,
      description,
      category,
      type,
      price: parseFloat(price) || 0,
      availability: parseInt(availability) || 0,
      imageUrl,
      date: date ? new Date(date) : null,
      location
    })
    res.status(201).json(item)
  } catch (err) {
    next(err)
  }
}

const updateItem = async (req, res, next) => {
  const { id } = req.params
  const { name, description, category, type, price, availability, imageUrl, date, location } = req.body
  try {
    const updated = await Item.findByIdAndUpdate(id, {
      name,
      description,
      category,
      type,
      price: parseFloat(price) || 0,
      availability: parseInt(availability) || 0,
      imageUrl,
      date: date ? new Date(date) : null,
      location
    })
    if (!updated) {
      return res.status(404).json({ error: 'NotFoundError', message: 'Item not found to update.' })
    }
    res.json(updated)
  } catch (err) {
    next(err)
  }
}

const deleteItem = async (req, res, next) => {
  const { id } = req.params
  try {
    const deleted = await Item.findByIdAndDelete(id)
    if (!deleted) {
      return res.status(404).json({ error: 'NotFoundError', message: 'Item not found to delete.' })
    }
    res.json({ success: true, message: 'Item deleted successfully.' })
  } catch (err) {
    next(err)
  }
}

module.exports = {
  getItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem
}
