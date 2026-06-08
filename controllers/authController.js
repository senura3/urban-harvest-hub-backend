const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const webpush = require('web-push')
const User = require('../models/User')
const { queries } = require('../models/db')

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_eco_key_harvest_hub_development'

// Manage dynamic VAPID configuration auto-generation
let vapidPublicKey = process.env.VAPID_PUBLIC_KEY
let vapidPrivateKey = process.env.VAPID_PRIVATE_KEY

if (!vapidPublicKey || !vapidPrivateKey) {
  const keys = webpush.generateVAPIDKeys()
  vapidPublicKey = keys.publicKey
  vapidPrivateKey = keys.privateKey
  console.log("=== AUTO GENERATED SESSION VAPID KEYS ===")
  console.log("Public VAPID: ", vapidPublicKey)
  console.log("Private VAPID:", vapidPrivateKey)
  console.log("=========================================")
}

webpush.setVapidDetails(
  'mailto:hello@urbanharvesthub.org',
  vapidPublicKey,
  vapidPrivateKey
)

const register = async (req, res, next) => {
  const { name, email, password, role } = req.body
  try {
    const existingUser = await User.findByEmail(email)
    if (existingUser) {
      return res.status(400).json({ error: 'ConflictError', message: 'Email address is already registered.' })
    }

    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || 'member'
    })

    const token = jwt.sign(
      { id: newUser.id || newUser._id, email: newUser.email, role: newUser.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.status(201).json({
      token,
      user: {
        id: newUser.id || newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      }
    })
  } catch (err) {
    next(err)
  }
}

const login = async (req, res, next) => {
  const { email, password } = req.body
  try {
    const user = await User.findByEmail(email)
    if (!user) {
      return res.status(400).json({ error: 'AuthError', message: 'Invalid email or password.' })
    }

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return res.status(400).json({ error: 'AuthError', message: 'Invalid email or password.' })
    }

    const token = jwt.sign(
      { id: user.id || user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.json({
      token,
      user: {
        id: user.id || user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    })
  } catch (err) {
    next(err)
  }
}

const getVapidKey = (req, res) => {
  res.json({ publicKey: vapidPublicKey })
}

const subscribe = async (req, res, next) => {
  const subscription = req.body
  try {
    await queries.addSubscription(subscription)
    res.status(201).json({ success: true, message: 'Subscribed to push notifications successfully.' })
  } catch (err) {
    next(err)
  }
}

module.exports = {
  register,
  login,
  getVapidKey,
  subscribe,
  vapidPublicKey,
  vapidPrivateKey
}
module.exports.webpush = webpush
