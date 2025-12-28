import { Router } from '../core/Router'
import { AuthController } from '../controllers/AuthController'
import { registerValidation, loginValidation } from '../validations/AuthValidation'
import AuthDoc from '../docs/auth'

const router = new Router('/auth')
const controller = new AuthController()

router.post('/register', registerValidation(), controller.register).doc(AuthDoc.registerDoc)

router.post('/login', loginValidation(), controller.login).doc(AuthDoc.loginDoc)

export default router
