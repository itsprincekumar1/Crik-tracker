import { createLogger, format, transports } from 'winston'
import path from 'path'
import fs from 'fs'

const logDir = path.join(process.cwd(), 'logs')
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir)

export const logger = createLogger({
  level: 'info',
  format: format.combine(format.timestamp(), format.json()),
  transports: [
    new transports.Console({
      level: process.env.LOG_LEVEL || 'info',
      format: format.printf(({ message }) => String(message)), // Only log the message to the console
    }),
    new transports.File({
      filename: path.join(logDir, 'app.log'),
      format: format.combine(format.timestamp(), format.json()), // Full log details in the file
    }),
  ],
})

export const stream = {
  write: (message: string) => {
    logger.http(message.trim())
  },
}