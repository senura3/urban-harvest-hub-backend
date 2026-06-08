require('dotenv').config()
const bcrypt = require('bcryptjs')
const mongoose = require('mongoose')
const path = require('path')
const { connectDB, queries, getIsMongo } = require('./models/db')

const seedData = {
  products: [
    {
      name: "Organic Heirloom Seed Box",
      description: "A curated box of 12 vegetable and herb seed packets, all organic, open-pollinated, and non-GMO. Includes planting guides.",
      category: "garden",
      type: "product",
      price: 24.99,
      availability: 15,
      imageUrl: "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?q=80&w=600&auto=format&fit=crop",
      location: "Local Hub Shop"
    },
    {
      name: "Bokashi Indoor Compost Kit",
      description: "Ferment food waste in your kitchen without smells. Kit includes double-bucket container and 1kg of active Bokashi bran.",
      category: "garden",
      type: "product",
      price: 45.00,
      availability: 8,
      imageUrl: "https://images.unsplash.com/photo-1599599810769-bcde5a160d32?q=80&w=600&auto=format&fit=crop",
      location: "Local Hub Shop"
    },
    {
      name: "Reusable Organic Cotton Produce Bags",
      description: "Pack of 5 mesh and muslin bags with drawstrings. Completely biodegradable and washable. Zero waste packaging.",
      category: "lifestyle",
      type: "product",
      price: 14.50,
      availability: 30,
      imageUrl: "https://images.unsplash.com/photo-1618220179428-22790b461013?q=80&w=600&auto=format&fit=crop",
      location: "Local Hub Shop"
    },
    {
      name: "Handcrafted Bamboo Mason Bee House",
      description: "Provide a safe nesting environment for native pollinators. Made from sustainable bamboo and local reclaimed timber.",
      category: "garden",
      type: "product",
      price: 32.00,
      availability: 12,
      imageUrl: "https://images.unsplash.com/photo-1473081556163-2a17de81fc97?q=80&w=600&auto=format&fit=crop",
      location: "Local Hub Shop"
    },
    {
      name: "Stainless Steel Bento Lunchbox",
      description: "Double-tier leakproof design with adjustable compartments. Keep your lunch fresh and reduce plastic wrap usage.",
      category: "lifestyle",
      type: "product",
      price: 28.99,
      availability: 25,
      imageUrl: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=600&auto=format&fit=crop",
      location: "Local Hub Shop"
    },
    {
      name: "Artisanal Sourdough Starter Kit",
      description: "Everything needed to bake sourdough: dehydrated 100-year heirloom starter, organic flour, proofing basket, and dough whisk.",
      category: "food",
      type: "product",
      price: 19.99,
      availability: 18,
      imageUrl: "https://images.unsplash.com/photo-1547592180-85f173990554?q=80&w=600&auto=format&fit=crop",
      location: "Local Hub Shop"
    }
  ],
  workshops: [
    {
      name: "Introduction to Composting",
      description: "Learn the magic of turning kitchen scraps and garden waste into rich black gold. We cover hot, cold, and vermicomposting systems.",
      category: "education",
      type: "workshop",
      price: 15.00,
      availability: 10,
      imageUrl: "https://images.unsplash.com/photo-1592150621744-aca64f48394a?q=80&w=600&auto=format&fit=crop",
      date: "2026-07-15T10:00:00.000Z",
      location: "Community Garden Shed"
    },
    {
      name: "Urban Farming & Container Gardening",
      description: "Maximize small spaces to grow your own salad crops, root crops, and fruiting bushes in pots, window boxes, and hanging baskets.",
      category: "garden",
      type: "workshop",
      price: 25.00,
      availability: 12,
      imageUrl: "https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?q=80&w=600&auto=format&fit=crop",
      date: "2026-07-22T09:30:00.000Z",
      location: "Learning Greenhouse"
    },
    {
      name: "Zero-Waste Plant-Based Cooking",
      description: "Create gourmet meals utilizing standard pantry items, vegetable scraps, and local herbs. Tips on storing, fermentation, and menu planning.",
      category: "food",
      type: "workshop",
      price: 30.00,
      availability: 8,
      imageUrl: "https://images.unsplash.com/photo-1547592180-85f173990554?q=80&w=600&auto=format&fit=crop",
      date: "2026-07-29T14:00:00.000Z",
      location: "Hub Community Kitchen"
    },
    {
      name: "Permaculture Design Principles",
      description: "Discover earth care, people care, and fair share ethics. Map out zones, identify water capture paths, and design food forests.",
      category: "education",
      type: "workshop",
      price: 20.00,
      availability: 15,
      imageUrl: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?q=80&w=600&auto=format&fit=crop",
      date: "2026-08-05T10:00:00.000Z",
      location: "Outdoor Amphitheater"
    },
    {
      name: "Microgreens and Sprouting at Home",
      description: "Grow nutritional powerhouses inside your home in just 7 days. Learn about tray preparation, lighting, and watering.",
      category: "garden",
      type: "workshop",
      price: 12.00,
      availability: 20,
      imageUrl: "https://images.unsplash.com/photo-1515150144380-bca9f1650ed9?q=80&w=600&auto=format&fit=crop",
      date: "2026-08-12T11:00:00.000Z",
      location: "Hub Main Room"
    },
    {
      name: "Eco-Friendly DIY Home Care",
      description: "Make your own non-toxic kitchen sprays, laundry detergent, and dish soaps using simple ingredients like vinegar, soda, and essential oils.",
      category: "lifestyle",
      type: "workshop",
      price: 18.00,
      availability: 10,
      imageUrl: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=600&auto=format&fit=crop",
      date: "2026-08-19T13:00:00.000Z",
      location: "Hub Creative Studio"
    }
  ],
  events: [
    {
      title: "Summer Harvest Community Festival",
      description: "Celebrate the community yield with live folk music, local food stalls, eco crafts, and organic farming demonstrations. Fun for all ages!",
      date: "2026-08-25T12:00:00.000Z",
      location: "Community Garden Green, London",
      category: "lifestyle",
      imageUrl: "https://images.unsplash.com/photo-1533105079780-92b9be482077?q=80&w=600&auto=format&fit=crop",
      maxAttendees: 150,
      latitude: 51.520,
      longitude: -0.095
    },
    {
      title: "Community Garden Workday",
      description: "Roll up your sleeves and help prepare new raised beds, plant organic fruit trees, and paint the compost bins. Free hot lunch provided for all helpers.",
      date: "2026-07-12T09:00:00.000Z",
      location: "East End Hub Allotments, London",
      category: "garden",
      imageUrl: "https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?q=80&w=600&auto=format&fit=crop",
      maxAttendees: 40,
      latitude: 51.535,
      longitude: -0.052
    },
    {
      title: "Autumn Seed and Plant Swap",
      description: "Bring your surplus seeds, vegetable seedlings, houseplant cuttings, and gardening books to swap. Share knowledge and varieties with local growers.",
      date: "2026-09-05T10:00:00.000Z",
      location: "Town Hall Plaza, London",
      category: "education",
      imageUrl: "https://images.unsplash.com/photo-1595855759920-86582396756a?q=80&w=600&auto=format&fit=crop",
      maxAttendees: 80,
      latitude: 51.507,
      longitude: -0.125
    },
    {
      title: "Eco-Living Farmers Market",
      description: "Browse rows of organic vegetables, cold-pressed fruit juices, vegan cheeses, zero-waste cosmetic bars, and green energy advice tables.",
      date: "2026-07-26T08:00:00.000Z",
      location: "Harvest Hub Central Hall, London",
      category: "food",
      imageUrl: "https://images.unsplash.com/photo-1488459719781-3185559c4029?q=80&w=600&auto=format&fit=crop",
      maxAttendees: 200,
      latitude: 51.492,
      longitude: -0.150
    }
  ]
}

const seed = async () => {
  console.log("Starting database seeding process...")
  await connectDB()
  
  const isMongo = getIsMongo()
  
  // Clear Existing collections
  if (isMongo) {
    console.log("Clearing MongoDB collections...")
    await mongoose.connection.db.dropDatabase()
    console.log("MongoDB dropDatabase complete.")
  } else {
    console.log("Clearing SQLite database tables...")
    let Database;
    try {
      Database = require('better-sqlite3')
    } catch (err) {
      const { DatabaseSync } = require('node:sqlite')
      Database = DatabaseSync
    }
    const sqliteDb = new Database(path.join(__dirname, 'data/harvest.db'))
    sqliteDb.prepare('DELETE FROM users').run()
    sqliteDb.prepare('DELETE FROM items').run()
    sqliteDb.prepare('DELETE FROM events').run()
    sqliteDb.prepare('DELETE FROM bookings').run()
    sqliteDb.prepare('DELETE FROM subscriptions').run()
    console.log("SQLite delete queries completed.")
  }

  // Create Users
  const salt = await bcrypt.genSalt(10)
  const hashedAdminPassword = await bcrypt.hash('admin123', salt)
  const hashedMemberPassword = await bcrypt.hash('member123', salt)

  console.log("Seeding accounts...")
  await queries.createUser({
    name: "Harvest Administrator",
    email: "admin@harvest.org",
    password: hashedAdminPassword,
    role: "admin"
  })

  await queries.createUser({
    name: "Eco Member",
    email: "member@harvest.org",
    password: hashedMemberPassword,
    role: "member"
  })

  // Seed Products
  console.log(`Seeding ${seedData.products.length} products...`)
  for (const product of seedData.products) {
    await queries.createItem(product)
  }

  // Seed Workshops
  console.log(`Seeding ${seedData.workshops.length} workshops...`)
  for (const workshop of seedData.workshops) {
    await queries.createItem(workshop)
  }

  // Seed Events
  console.log(`Seeding ${seedData.events.length} events...`)
  for (const event of seedData.events) {
    await queries.createEvent(event)
  }

  console.log("=========================================")
  console.log("Database seeded successfully!")
  console.log("Admin account: admin@harvest.org / admin123")
  console.log("Member account: member@harvest.org / member123")
  console.log("=========================================")
  
  if (isMongo) {
    await mongoose.connection.close()
  }
  process.exit(0)
}

seed().catch(err => {
  console.error("Critical seeding failure:", err)
  process.exit(1)
})
