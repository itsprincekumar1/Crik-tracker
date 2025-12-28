import { Router } from '../core/Router'
import { MatchController } from '../controllers/MatchController'
import { requireAuth } from '../middlewares/requireAuth'
import { validate } from '../middlewares/validators/validate'
import { createMatchSchema, joinMatchSchema } from '../validations/MatchValidation'
import { requireMatchToken } from '../middlewares/requireMatchToken'
import MatchDoc from '../docs/matchDoc'

const router = new Router('/matches')
const controller = new MatchController()

router.post('/', requireAuth, validate({ body: createMatchSchema }), controller.createMatch)
router.get('/:matchId', requireMatchToken, controller.getMatch).doc(MatchDoc.getMatchDoc)
router
  .post('/:matchId/join', validate({ body: joinMatchSchema }), controller.joinMatch)
  .doc(MatchDoc.joinMatchDoc)
router.post('/:matchId/end', requireAuth, controller.endMatch).doc(MatchDoc.endMatchDoc)
router.post('/:matchId/leave', requireMatchToken, controller.leaveMatch).doc(MatchDoc.leaveMatchDoc)

export default router
