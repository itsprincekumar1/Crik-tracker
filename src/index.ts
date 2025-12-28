import { CONFIG } from './config/env'
import { AppServer } from './core/AppServer'
import registerRoutes from './routes'

const app = new AppServer()

;(async () => {
  await app.setup()
  registerRoutes(app)
  app.docs()
  app.listen(CONFIG.PORT)
})()
