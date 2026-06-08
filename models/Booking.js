const { queries } = require('./db')

module.exports = {
  create: queries.createBooking,
  find: queries.getBookings,
  findByIdAndUpdate: queries.updateBookingStatus
}
