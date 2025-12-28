import { AppServer } from '../core/AppServer'
import MatchRoutes from './MatchRoutes'
import AuthRoutes from './AuthRoutes'
import SocketTestRoutes from './SocketTestRoutes'

export default function registerRoutes(app: AppServer) {
  app.useRouter(MatchRoutes)
  app.useRouter(AuthRoutes)
  app.useRouter(SocketTestRoutes)
}
