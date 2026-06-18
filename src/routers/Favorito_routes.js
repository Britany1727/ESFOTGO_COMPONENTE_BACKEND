import { Router } from 'express';
import { verificarTokenJWT } from '../middlewares/JWT.js';
import {
    listarFavoritos,
    crearFavorito,
    eliminarFavorito
} from '../controllers/favorito_controllers.js';

const routerFavorito = Router();

routerFavorito.get('/favoritos', verificarTokenJWT, listarFavoritos);
routerFavorito.post('/favoritos', verificarTokenJWT, crearFavorito);
routerFavorito.delete('/favoritos/:id', verificarTokenJWT, eliminarFavorito);

export default routerFavorito;
