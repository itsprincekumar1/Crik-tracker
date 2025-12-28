import { Router } from '../core/Router'
import { SocketTestController } from '../controllers/SocketTestController'
import { requireAuth } from '../middlewares/requireAuth'
import SocketDoc from '../docs/socket'

const router = new Router('/socket-test')
const controller = new SocketTestController()

router.post('/emit', requireAuth, controller.emit).doc(SocketDoc.emitDoc)

export default router
