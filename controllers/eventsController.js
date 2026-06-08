const Event = require('../models/Event')
const { queries } = require('../models/db')
const webpush = require('web-push')

// Helper function to broadcast push notifications to all subscribers
const broadcastNotification = async (title, body, url) => {
  try {
    const subscriptions = await queries.getSubscriptions()
    const payload = JSON.stringify({
      title,
      body,
      url
    })

    console.log(`Broadcasting push notification to ${subscriptions.length} active subscriptions...`)
    
    const pushPromises = subscriptions.map(sub => {
      // Structure base VAPID subscription payload matching web-push schema
      const pushConfig = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.keys.p256dh,
          auth: sub.keys.auth
        }
      }
      return webpush.sendNotification(pushConfig, payload)
        .catch(err => {
          console.warn(`Clean subscription pruning trigger for endpoint: ${sub.endpoint}. Status: ${err.statusCode}`)
        })
    })

    await Promise.all(pushPromises)
  } catch (err) {
    console.error("Failed to broadcast push notification:", err)
  }
}

const getEvents = async (req, res, next) => {
  const { search } = req.query
  try {
    const events = await Event.find({ search })
    res.json(events)
  } catch (err) {
    next(err)
  }
}

const getEventById = async (req, res, next) => {
  const { id } = req.params
  try {
    const event = await Event.findById(id)
    if (!event) {
      return res.status(404).json({ error: 'NotFoundError', message: 'Event not found.' })
    }
    res.json(event)
  } catch (err) {
    next(err)
  }
}

const createEvent = async (req, res, next) => {
  const { title, description, date, location, category, imageUrl, maxAttendees, latitude, longitude } = req.body
  try {
    const event = await Event.create({
      title,
      description,
      date: new Date(date),
      location,
      category,
      imageUrl,
      maxAttendees: parseInt(maxAttendees) || 100,
      latitude: parseFloat(latitude) || 0,
      longitude: parseFloat(longitude) || 0
    })

    // Trigger push notification to all subscribers
    broadcastNotification(
      'New Community Event!',
      `"${title}" has been scheduled. Check details now!`,
      `/events/${event.id || event._id}`
    )

    res.status(201).json(event)
  } catch (err) {
    next(err)
  }
}

const updateEvent = async (req, res, next) => {
  const { id } = req.params
  const { title, description, date, location, category, imageUrl, maxAttendees, latitude, longitude } = req.body
  try {
    const updated = await Event.findByIdAndUpdate(id, {
      title,
      description,
      date: new Date(date),
      location,
      category,
      imageUrl,
      maxAttendees: parseInt(maxAttendees) || 100,
      latitude: parseFloat(latitude) || 0,
      longitude: parseFloat(longitude) || 0
    })
    if (!updated) {
      return res.status(404).json({ error: 'NotFoundError', message: 'Event not found to update.' })
    }
    res.json(updated)
  } catch (err) {
    next(err)
  }
}

const deleteEvent = async (req, res, next) => {
  const { id } = req.params
  try {
    const deleted = await Event.findByIdAndDelete(id)
    if (!deleted) {
      return res.status(404).json({ error: 'NotFoundError', message: 'Event not found to delete.' })
    }
    res.json({ success: true, message: 'Event deleted successfully.' })
  } catch (err) {
    next(err)
  }
}

module.exports = {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent
}
