const Booking = require('../models/Booking')

const createBooking = async (req, res, next) => {
  const { itemId, itemType, date, tickets, notes, name, email } = req.body
  const userId = req.user.id
  try {
    const booking = await Booking.create({
      user: userId,
      item: itemId,
      itemName: req.body.itemName || 'Urban Harvest booking',
      date: new Date(date),
      tickets: parseInt(tickets) || 1,
      notes: notes || '',
      name: name || req.user.name,
      email: email || req.user.email,
      status: 'confirmed'
    })
    res.status(201).json(booking)
  } catch (err) {
    next(err)
  }
}

const getBookings = async (req, res, next) => {
  const userId = req.user.id
  const role = req.user.role
  try {
    let bookings
    if (role === 'admin') {
      // Admin gets all bookings
      bookings = await Booking.find()
    } else {
      // Member gets only their bookings
      bookings = await Booking.find(userId)
    }
    res.json(bookings)
  } catch (err) {
    next(err)
  }
}

const updateBookingStatus = async (req, res, next) => {
  const { id } = req.params
  const { status } = req.body
  try {
    if (!['confirmed', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'ValidationError', message: 'Status must be confirmed or cancelled' })
    }
    const updated = await Booking.findByIdAndUpdate(id, status)
    if (!updated) {
      return res.status(404).json({ error: 'NotFoundError', message: 'Booking not found.' })
    }
    res.json(updated)
  } catch (err) {
    next(err)
  }
}

module.exports = {
  createBooking,
  getBookings,
  updateBookingStatus
}
