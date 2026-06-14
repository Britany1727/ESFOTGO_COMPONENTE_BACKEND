import { Router } from 'express'
import { verificarTokenJWT } from '../middlewares/JWT.js'
import {
  listarRutas,
  verRuta,
  crearRuta,
  actualizarRuta,
  eliminarRuta,
  listarParadas,
  crearParada,
  actualizarParada,
  eliminarParada,
  obtenerPosiciones
} from '../controllers/bus_controllers.js'

const routerBus = Router()

routerBus.get('/bus/rutas', listarRutas)
routerBus.get('/bus/rutas/:id', verRuta)
routerBus.get('/bus/paradas/:routeId', listarParadas)
routerBus.get('/bus/posiciones/:routeId', obtenerPosiciones)

routerBus.post('/admin/bus/rutas', verificarTokenJWT, crearRuta)
routerBus.put('/admin/bus/rutas/:id', verificarTokenJWT, actualizarRuta)
routerBus.delete('/admin/bus/rutas/:id', verificarTokenJWT, eliminarRuta)

routerBus.post('/admin/bus/paradas', verificarTokenJWT, crearParada)
routerBus.put('/admin/bus/paradas/:id', verificarTokenJWT, actualizarParada)
routerBus.delete('/admin/bus/paradas/:id', verificarTokenJWT, eliminarParada)

export default routerBus
