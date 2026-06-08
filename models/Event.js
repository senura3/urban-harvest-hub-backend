const { queries } = require('./db')

module.exports = {
  find: queries.getEvents,
  findById: queries.getEventById,
  create: queries.createEvent,
  findByIdAndUpdate: queries.updateEvent,
  findByIdAndDelete: queries.deleteEvent
}
