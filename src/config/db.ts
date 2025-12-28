import mongoose from 'mongoose'
import { logger } from '../core/Logger'
import { CONFIG } from './env'

let connected = false

export async function connect() {
  const uri = CONFIG.MONGODB_URI
  if (!uri) {
    logger.warn('MONGODB_URI not set')
    return
  }
  if (connected) return
  await mongoose.connect(uri, { autoIndex: true })
  connected = true
  logger.info('MongoDB connected')
}
