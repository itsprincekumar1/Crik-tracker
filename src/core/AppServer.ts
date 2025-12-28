import express, { Application } from 'express'
import http from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import requestIp from 'request-ip'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import mongoSanitize from 'express-mongo-sanitize'
import hpp from 'hpp'
import cookieParser from 'cookie-parser'
import bodyParser from 'body-parser'
import morgan from 'morgan'
import swaggerUI from 'swagger-ui-express'
import { logger, stream } from './Logger'
import { connect } from '../config/db'
import { init as initRooms } from '../sockets/Rooms'
import { build } from '../docs/openapi'
import { setIO } from './Socket'
import { responseMiddleware } from '../middlewares/response'
import { requestSanitize } from '../middlewares/requestSanitize'
import { CONFIG } from '../config/env'

export class AppServer {
  app: Application
  server: http.Server
  io: Server
  docsStore: { paths: Record<string, any> }

  constructor() {
    this.app = express()
    this.server = http.createServer(this.app)
    this.io = new Server(this.server, { cors: { origin: true, credentials: true } })
    this.docsStore = { paths: {} }
  }

  async setup() {
    this.app.disable('x-powered-by')
    this.app.use(helmet())
    this.app.use(requestIp.mw())
    this.app.use(
      cors({
        origin: (origin, cb) => cb(null, true),
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
        maxAge: 600,
      })
    )
    this.app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }))
    this.app.use(mongoSanitize())
    this.app.use(hpp())
    this.app.use(cookieParser())
    this.app.use(bodyParser.json({ limit: '1mb' }))
    this.app.use(bodyParser.urlencoded({ extended: false }))
    this.app.use(morgan('combined', { stream } as any))
    this.app.use(responseMiddleware)
    this.app.use(requestSanitize)
    await connect()
    initRooms(this.io)
    setIO(this.io)
  }

  useRouter(
    router: {
      apply: (app: Application, docsStore: { paths: Record<string, any> }, prefix?: string) => void
    },
    prefix?: string
  ) {
    router.apply(this.app, this.docsStore, prefix ?? CONFIG.API_PREFIX)
  }

  docs() {
    const spec = build(this.docsStore)
    this.app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(spec))
  }

  listen(port?: number) {
    const p = port || CONFIG.PORT
    this.server.listen(p, () => {
      logger.info(`listening:${p}`)
      logger.info(`Run: http://localhost:${p}`)
    })
  }
}
