import { Router } from 'express'
import { verificarTokenJWT } from '../middlewares/JWT.js'
import {
  refreshToken,
  reenviarVerificacion,
  cambiarPassword
} from '../controllers/auth_controllers.js'

const routerAuth = Router()

routerAuth.post('/auth/refresh', refreshToken)
routerAuth.post('/estudiantes/reenviar-verificacion', reenviarVerificacion)
routerAuth.put('/actualizarperfil/cambiar-password', verificarTokenJWT, cambiarPassword)

export default routerAuth
