import { Router } from 'express';
import { verificarTokenJWT } from '../middlewares/JWT.js';
import {
    obtenerAreaEsfot,
    obtenerPuntosMapa,
    obtenerRuta,
    obtenerNodosNavegacion,
    obtenerGrafo,
    buscarDestino,
    crearNodo,
    crearConexion,
    crearEdificio,
    listarEdificios,
    verEdificio,
    actualizarEdificio,
    eliminarEdificio,
    obtenerVista360,
    listarNodos360,
    agregarHotspot,
    actualizarHotspot,
    eliminarHotspot
} from '../controllers/mapa_controllers.js';

const routerMapa = Router();

// MAPA - Área ESFOT (público)
routerMapa.get('/mapa/area', obtenerAreaEsfot);
routerMapa.get('/mapa/puntos', obtenerPuntosMapa);
routerMapa.get('/mapa/buscar', buscarDestino);

// RUTAS (público)
routerMapa.get('/mapa/ruta', obtenerRuta);

// NAVEGACIÓN - Nodos y Grafo (público)
routerMapa.get('/mapa/nodos', obtenerNodosNavegacion);
routerMapa.get('/mapa/grafo', obtenerGrafo);

// VISTA 360 (público)
routerMapa.get('/mapa/360/:id', obtenerVista360);
routerMapa.get('/mapa/360', listarNodos360);

// HOTSPOTS 360 (admin)
routerMapa.post('/admin/mapa/360/hotspot/:id', verificarTokenJWT, agregarHotspot);
routerMapa.put('/admin/mapa/360/hotspot/:nodoId/:hotspotId', verificarTokenJWT, actualizarHotspot);
routerMapa.delete('/admin/mapa/360/hotspot/:nodoId/:hotspotId', verificarTokenJWT, eliminarHotspot);

// EDIFICIOS CRUD (admin)
routerMapa.post('/admin/mapa/edificio', verificarTokenJWT, crearEdificio);
routerMapa.get('/admin/mapa/edificios', verificarTokenJWT, listarEdificios);
routerMapa.get('/admin/mapa/edificio/:id', verificarTokenJWT, verEdificio);
routerMapa.put('/admin/mapa/edificio/:id', verificarTokenJWT, actualizarEdificio);
routerMapa.delete('/admin/mapa/edificio/:id', verificarTokenJWT, eliminarEdificio);

// NODOS Y CONEXIONES (admin)
routerMapa.post('/admin/mapa/nodo', verificarTokenJWT, crearNodo);
routerMapa.post('/admin/mapa/conexion', verificarTokenJWT, crearConexion);

export default routerMapa;
