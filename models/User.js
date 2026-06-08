const { queries } = require('./db')

module.exports = {
  create: queries.createUser,
  findByEmail: queries.findUserByEmail,
  findById: queries.findUserById
}
