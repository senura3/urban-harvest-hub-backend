const { queries } = require('./db')

module.exports = {
  find: queries.getItems,
  findById: queries.getItemById,
  create: queries.createItem,
  findByIdAndUpdate: queries.updateItem,
  findByIdAndDelete: queries.deleteItem
}
