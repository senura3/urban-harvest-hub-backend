const fs = require('fs')
const path = require('path')
const mongoose = require('mongoose')
let Database

// Check if better-sqlite3 should be loaded
let sqliteDb = null
let isMongo = false

const MONGODB_URI = process.env.MONGODB_URI

// Setup Mongoose schemas
const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['member', 'admin'], default: 'member' }
})
const UserModel = mongoose.models.User || mongoose.model('User', UserSchema)

const ItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, enum: ['food', 'lifestyle', 'education', 'garden'] },
  type: { type: String, enum: ['product', 'workshop'] },
  price: Number,
  availability: Number,
  imageUrl: String,
  date: Date,
  location: String,
  createdAt: { type: Date, default: Date.now }
})
const ItemModel = mongoose.models.Item || mongoose.model('Item', ItemSchema)

const EventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  date: { type: Date, required: true },
  location: String,
  category: String,
  imageUrl: String,
  maxAttendees: Number,
  latitude: Number,
  longitude: Number,
  attendees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
})
const EventModel = mongoose.models.Event || mongoose.model('Event', EventSchema)

const BookingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name: String,
  email: String,
  item: { type: mongoose.Schema.Types.ObjectId, ref: 'Item' },
  itemName: String,
  date: Date,
  tickets: Number,
  status: { type: String, enum: ['confirmed', 'cancelled'], default: 'confirmed' }
})
const BookingModel = mongoose.models.Booking || mongoose.model('Booking', BookingSchema)

const SubscriptionSchema = new mongoose.Schema({
  endpoint: { type: String, unique: true, required: true },
  keys: {
    p256dh: String,
    auth: String
  }
})
const SubscriptionModel = mongoose.models.Subscription || mongoose.model('Subscription', SubscriptionSchema)

// Connect function
const connectDB = async () => {
  if (MONGODB_URI) {
    try {
      await mongoose.connect(MONGODB_URI)
      isMongo = true
      console.log("Connected to MongoDB successfully!")
      return
    } catch (err) {
      console.warn("MongoDB connection failed. Switching to SQLite fallback. Error:", err.message)
    }
  }

  // SQLite Fallback
  isMongo = false
  console.log("Using SQLite Database fallback...")
  const dataDir = path.join(__dirname, '../data')
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }

  let Database;
  try {
    Database = require('better-sqlite3')
    console.log("better-sqlite3 loaded successfully.")
  } catch (err) {
    console.log("better-sqlite3 native module is not compiled. Loading native node:sqlite as fallback...")
    const { DatabaseSync } = require('node:sqlite')
    Database = class {
      constructor(filename, options) {
        this.db = new DatabaseSync(filename, options)
      }
      exec(sql) {
        return this.db.exec(sql)
      }
      prepare(sql) {
        const stmt = this.db.prepare(sql)
        return {
          run: (...params) => {
            const res = stmt.run(...params)
            return {
              changes: res.changes,
              lastInsertRowid: res.lastInsertRowid
            }
          },
          get: (...params) => stmt.get(...params),
          all: (...params) => stmt.all(...params)
        }
      }
    }
  }

  sqliteDb = new Database(path.join(dataDir, 'harvest.db'), { verbose: console.log })
  
  // Create tables if they don't exist
  sqliteDb.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT,
      email TEXT UNIQUE,
      password TEXT,
      role TEXT DEFAULT 'member'
    );

    CREATE TABLE IF NOT EXISTS items (
      id TEXT PRIMARY KEY,
      name TEXT,
      description TEXT,
      category TEXT,
      type TEXT,
      price REAL,
      availability INTEGER,
      imageUrl TEXT,
      date TEXT,
      location TEXT,
      createdAt TEXT
    );

    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      title TEXT,
      description TEXT,
      date TEXT,
      location TEXT,
      category TEXT,
      imageUrl TEXT,
      maxAttendees INTEGER,
      latitude REAL,
      longitude REAL
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY,
      userId TEXT,
      name TEXT,
      email TEXT,
      itemId TEXT,
      itemName TEXT,
      date TEXT,
      tickets INTEGER,
      status TEXT DEFAULT 'confirmed'
    );

    CREATE TABLE IF NOT EXISTS subscriptions (
      id TEXT PRIMARY KEY,
      endpoint TEXT UNIQUE,
      keys_p256dh TEXT,
      keys_auth TEXT
    );
  `)
  console.log("SQLite tables initialized.")
}

// Common queries adapter wrapping Mongoose and SQLite
const queries = {
  // Users
  createUser: async (data) => {
    if (isMongo) {
      return await UserModel.create(data)
    } else {
      const id = 'usr_' + Date.now()
      sqliteDb.prepare('INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)')
        .run(id, data.name, data.email, data.password, data.role || 'member')
      return { id, ...data }
    }
  },
  findUserByEmail: async (email) => {
    if (isMongo) {
      return await UserModel.findOne({ email })
    } else {
      const row = sqliteDb.prepare('SELECT * FROM users WHERE email = ?').get(email)
      return row || null
    }
  },
  findUserById: async (id) => {
    if (isMongo) {
      return await UserModel.findById(id)
    } else {
      const row = sqliteDb.prepare('SELECT * FROM users WHERE id = ?').get(id)
      return row || null
    }
  },

  // Items (Products & Workshops)
  getItems: async (filters = {}) => {
    if (isMongo) {
      const query = {}
      if (filters.category && filters.category !== 'all') query.category = filters.category
      if (filters.type) query.type = filters.type
      if (filters.search) {
        query.$or = [
          { name: { $regex: filters.search, $options: 'i' } },
          { description: { $regex: filters.search, $options: 'i' } }
        ]
      }
      return await ItemModel.find(query)
    } else {
      let sql = 'SELECT * FROM items WHERE 1=1'
      const params = []
      if (filters.category && filters.category !== 'all') {
        sql += ' AND category = ?'
        params.push(filters.category)
      }
      if (filters.type) {
        sql += ' AND type = ?'
        params.push(filters.type)
      }
      if (filters.search) {
        sql += ' AND (name LIKE ? OR description LIKE ?)'
        params.push(`%${filters.search}%`, `%${filters.search}%`)
      }
      return sqliteDb.prepare(sql).all(...params)
    }
  },
  getItemById: async (id) => {
    if (isMongo) {
      return await ItemModel.findById(id)
    } else {
      const row = sqliteDb.prepare('SELECT * FROM items WHERE id = ?').get(id)
      return row || null
    }
  },
  createItem: async (data) => {
    if (isMongo) {
      return await ItemModel.create(data)
    } else {
      const id = 'item_' + Date.now()
      const createdAt = new Date().toISOString()
      const itemDate = data.date instanceof Date ? data.date.toISOString() : (data.date || '')
      sqliteDb.prepare(`
        INSERT INTO items (id, name, description, category, type, price, availability, imageUrl, date, location, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id, data.name, data.description, data.category, data.type, 
        data.price, data.availability, data.imageUrl, itemDate, data.location || '', createdAt
      )
      return { id, createdAt, ...data }
    }
  },
  updateItem: async (id, data) => {
    if (isMongo) {
      return await ItemModel.findByIdAndUpdate(id, data, { new: true })
    } else {
      const itemDate = data.date instanceof Date ? data.date.toISOString() : (data.date || '')
      sqliteDb.prepare(`
        UPDATE items 
        SET name = ?, description = ?, category = ?, type = ?, price = ?, availability = ?, imageUrl = ?, date = ?, location = ?
        WHERE id = ?
      `).run(
        data.name, data.description, data.category, data.type, 
        data.price, data.availability, data.imageUrl, itemDate, data.location || '', id
      )
      return { id, ...data }
    }
  },
  deleteItem: async (id) => {
    if (isMongo) {
      return await ItemModel.findByIdAndDelete(id)
    } else {
      return sqliteDb.prepare('DELETE FROM items WHERE id = ?').run(id)
    }
  },

  // Events
  getEvents: async (filters = {}) => {
    if (isMongo) {
      const query = {}
      if (filters.search) {
        query.title = { $regex: filters.search, $options: 'i' }
      }
      return await EventModel.find(query)
    } else {
      let sql = 'SELECT * FROM events WHERE 1=1'
      const params = []
      if (filters.search) {
        sql += ' AND title LIKE ?'
        params.push(`%${filters.search}%`)
      }
      const rows = sqliteDb.prepare(sql).all(...params)
      // Map attendees as empty array for SQLite mapping structure matching
      return rows.map(r => ({ ...r, attendees: [] }))
    }
  },
  getEventById: async (id) => {
    if (isMongo) {
      return await EventModel.findById(id)
    } else {
      const row = sqliteDb.prepare('SELECT * FROM events WHERE id = ?').get(id)
      if (row) {
        return { ...row, attendees: [] }
      }
      return null
    }
  },
  createEvent: async (data) => {
    if (isMongo) {
      return await EventModel.create(data)
    } else {
      const id = 'ev_' + Date.now()
      const eventDate = data.date instanceof Date ? data.date.toISOString() : (data.date || '')
      sqliteDb.prepare(`
        INSERT INTO events (id, title, description, date, location, category, imageUrl, maxAttendees, latitude, longitude)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id, data.title, data.description || '', eventDate, data.location || '', 
        data.category || '', data.imageUrl || '', data.maxAttendees || 100, data.latitude || 0, data.longitude || 0
      )
      return { id, attendees: [], ...data }
    }
  },
  updateEvent: async (id, data) => {
    if (isMongo) {
      return await EventModel.findByIdAndUpdate(id, data, { new: true })
    } else {
      const eventDate = data.date instanceof Date ? data.date.toISOString() : (data.date || '')
      sqliteDb.prepare(`
        UPDATE events 
        SET title = ?, description = ?, date = ?, location = ?, category = ?, imageUrl = ?, maxAttendees = ?, latitude = ?, longitude = ?
        WHERE id = ?
      `).run(
        data.title, data.description || '', eventDate, data.location || '', 
        data.category || '', data.imageUrl || '', data.maxAttendees || 100, data.latitude || 0, data.longitude || 0, id
      )
      return { id, attendees: [], ...data }
    }
  },
  deleteEvent: async (id) => {
    if (isMongo) {
      return await EventModel.findByIdAndDelete(id)
    } else {
      return sqliteDb.prepare('DELETE FROM events WHERE id = ?').run(id)
    }
  },

  // Bookings
  createBooking: async (data) => {
    if (isMongo) {
      return await BookingModel.create(data)
    } else {
      const id = 'bk_' + Date.now()
      const bookingDate = data.date instanceof Date ? data.date.toISOString() : (data.date || '')
      sqliteDb.prepare(`
        INSERT INTO bookings (id, userId, name, email, itemId, itemName, date, tickets, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'confirmed')
      `).run(
        id, data.user || 'anonymous', data.name || '', data.email || '', data.item || data.itemId,
        data.itemName || 'Booking Item', bookingDate, data.tickets || 1
      )
      return { id, status: 'confirmed', ...data }
    }
  },
  getBookings: async (userId = null) => {
    if (isMongo) {
      const query = userId ? { user: userId } : {}
      return await BookingModel.find(query).populate('user').populate('item')
    } else {
      if (userId) {
        return sqliteDb.prepare('SELECT * FROM bookings WHERE userId = ?').all(userId)
      }
      return sqliteDb.prepare('SELECT * FROM bookings').all()
    }
  },
  updateBookingStatus: async (id, status) => {
    if (isMongo) {
      return await BookingModel.findByIdAndUpdate(id, { status }, { new: true })
    } else {
      sqliteDb.prepare('UPDATE bookings SET status = ? WHERE id = ?').run(status, id)
      return { id, status }
    }
  },

  // Push Subscriptions
  addSubscription: async (subscription) => {
    if (isMongo) {
      return await SubscriptionModel.findOneAndUpdate(
        { endpoint: subscription.endpoint },
        subscription,
        { upsert: true, new: true }
      )
    } else {
      const id = 'sub_' + Date.now()
      try {
        sqliteDb.prepare(`
          INSERT INTO subscriptions (id, endpoint, keys_p256dh, keys_auth)
          VALUES (?, ?, ?, ?)
        `).run(id, subscription.endpoint, subscription.keys.p256dh, subscription.keys.auth)
      } catch (err) {
        // Handle unique constraint conflict (already subscribed)
        sqliteDb.prepare(`
          UPDATE subscriptions 
          SET keys_p256dh = ?, keys_auth = ?
          WHERE endpoint = ?
        `).run(subscription.keys.p256dh, subscription.keys.auth, subscription.endpoint)
      }
      return subscription
    }
  },
  getSubscriptions: async () => {
    if (isMongo) {
      return await SubscriptionModel.find({})
    } else {
      const rows = sqliteDb.prepare('SELECT * FROM subscriptions').all()
      return rows.map(r => ({
        endpoint: r.endpoint,
        keys: {
          p256dh: r.keys_p256dh,
          auth: r.keys_auth
        }
      }))
    }
  }
}

module.exports = {
  connectDB,
  queries,
  getIsMongo: () => isMongo
}
