import express from 'express'
import cors from 'cors'
import { createServer } from 'http'
import { ApolloServer } from '@apollo/server'
import { expressMiddleware } from '@apollo/server/express4'
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer'
import { makeExecutableSchema } from '@graphql-tools/schema'
import { WebSocketServer } from 'ws'
import { useServer } from 'graphql-ws/lib/use/ws'
import mongoose from 'mongoose'
import Redis from 'ioredis'
import dotenv from 'dotenv'
import { typeDefs } from './graphql/typeDefs'
import { resolvers } from './graphql/resolvers'
import { authMiddleware } from './middleware/auth'
import { logger } from './utils/logger'
import { setupMongoIndexes } from './utils/dbOptimization'
import apiRoutes from './routes'

dotenv.config()

const app = express()
const httpServer = createServer(app)
const PORT = process.env.PORT || 4000

// Redis client setup (optional - will work without it)
let redis: any = null
try {
  redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    maxRetriesPerRequest: 0,
    lazyConnect: true,
  })
  redis.on('connect', () => logger.info('Redis connected'))
  redis.on('error', () => {}) // Silently ignore Redis errors
} catch (error) {
  logger.info('Redis not available - running without cache')
}
export { redis }

// MongoDB connection with optimization
mongoose.set('strictQuery', false)
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/inventory', {
  maxPoolSize: 10,
  minPoolSize: 5,
  socketTimeoutMS: 45000,
  serverSelectionTimeoutMS: 5000,
})

mongoose.connection.on('connected', async () => {
  logger.info('MongoDB connected')
  await setupMongoIndexes()
})

mongoose.connection.on('error', (err) => {
  logger.error('MongoDB error:', err)
})

// GraphQL schema
const schema = makeExecutableSchema({ typeDefs, resolvers })

// WebSocket server for subscriptions
const wsServer = new WebSocketServer({
  server: httpServer,
  path: '/graphql',
})

const serverCleanup = useServer(
  {
    schema,
    context: async (ctx) => {
      return { 
        redis,
        user: ctx.connectionParams?.authorization 
          ? await authMiddleware.verifyToken(ctx.connectionParams.authorization as string)
          : null
      }
    },
  },
  wsServer
)

// Apollo Server setup
const apolloServer = new ApolloServer({
  schema,
  plugins: [
    ApolloServerPluginDrainHttpServer({ httpServer }),
    {
      async serverWillStart() {
        return {
          async drainServer() {
            await serverCleanup.dispose()
          },
        }
      },
    },
  ],
})

async function startServer() {
  await apolloServer.start()

  // Express middleware
  const allowedOrigins = process.env.NODE_ENV === 'production' 
    ? [process.env.CLIENT_URL || 'https://inventory-client.onrender.com']
    : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173']
    
  app.use(cors({
    origin: allowedOrigins,
    credentials: true,
  }))
  
  app.use(express.json({ limit: '10mb' }))
  app.use(express.urlencoded({ extended: true, limit: '10mb' }))

  // REST API routes (for file uploads, legacy support)
  app.use('/api', apiRoutes)

  // GraphQL middleware
  app.use(
    '/graphql',
    expressMiddleware(apolloServer, {
      context: async ({ req }) => {
        const token = req.headers.authorization?.replace('Bearer ', '')
        const user = token ? await authMiddleware.verifyToken(token) : null
        
        return {
          user,
          redis,
          req,
        }
      },
    })
  )

  // Health check
  app.get('/health', (_req, res) => {
    res.json({ 
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        mongodb: mongoose.connection.readyState === 1,
        redis: redis.status === 'ready'
      }
    })
  })

  // Serve static files in production
  if (process.env.NODE_ENV === 'production') {
    const path = require('path')
    const clientBuildPath = path.join(__dirname, '../../client/dist')
    
    app.use(express.static(clientBuildPath))
    
    // Handle React routing, return index.html for all non-API routes
    app.get('*', (_req, res) => {
      res.sendFile(path.join(clientBuildPath, 'index.html'))
    })
  } else {
    // Development root route
    app.get('/', (_req, res) => {
      res.json({
        message: 'Inventory Management API (Development)',
        version: '1.0.0',
        graphql: '/graphql',
        health: '/health',
        timestamp: new Date().toISOString()
      })
    })
  }

  httpServer.listen(PORT, () => {
    logger.info(`🚀 Server ready at http://localhost:${PORT}`)
    logger.info(`🚀 GraphQL endpoint: http://localhost:${PORT}/graphql`)
    logger.info(`🚀 WebSocket endpoint: ws://localhost:${PORT}/graphql`)
  })
}

startServer().catch((err) => {
  logger.error('Failed to start server:', err)
  process.exit(1)
})