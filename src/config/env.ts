import path from 'path'
import dotenv from 'dotenv'

const env = process.env.NODE_ENV || 'development'
const file = env === 'development' ? '.env.local' : '.env.production'
dotenv.config({ path: path.join(process.cwd(), file) })

export const CONFIG = {
  PORT: process.env.PORT ? Number(process.env.PORT) : 3000,
  API_URL: process.env.API_URL || `http://localhost:${process.env.PORT || 3000}`,
  API_PREFIX: process.env.API_PREFIX || '/api/v1',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/match_score_db',
  JWT_SECRET: process.env.JWT_SECRET || 'dev',
}
