import Aula from "../models/Aulas.js";
import Oficina from "../models/Oficinas.js";
import Evento from "../models/Evento.js";
import Nodo from "../models/Nodo.js";
import Conexion from "../models/Conexion.js";
import Favorito from "../models/Favorito.js";
import { calcularRuta, obtenerGrafoCompleto } from "../services/routing.service.js";
import { subirImagenCloudinary } from "../helpers/uploadCloudinary.js";
import { successResponse, errorResponse } from "../helpers/response.js";

export const obtenerPuntosMapa = async (req, res) => {
    try {
        const aulas = await Aula.find();
        const oficinas = await Oficina.find();
        const eventos = await Evento.find({ fecha: { $gte: new Date() } });

        const puntos = [
            ...aulas.map(a => ({
                _id: a._id,
                nombre: `Aula ${a.numero}`,
                tipo: a.tipo,
                ubicacion: a.ubicacion,
                piso: a.piso,
                coordenadas: a.coordenadas,
                imagen: a.imagen,
                modelo: 'Aula'
            })),
            ...oficinas.map(o => ({
                _id: o._id,
                nombre: `Oficina ${o.numero}`,
                tipo: 'oficina',
                ubicacion: o.ubicacion,
                piso: o.piso,
                coordenadas: o.coordenadas,
                encargado: o.encargado,
                telefono: o.telefono,
                imagen: o.imagen,
                modelo: 'Oficina'
            })),
            ...eventos.map(e => ({
                _id: e._id,
                nombre: e.nombre,
                tipo: 'evento',
                ubicacion: e.ubicacion,
                coordenadas: e.coordenadas,
                fecha: e.fecha,
                hora: e.hora,
                organizador: e.organizador,
                modelo: 'Evento'
            }))
        ];

        return successResponse(res, puntos);
    } catch (error) {
        return errorResponse(res, `Error al obtener puntos del mapa - ${error.message}`);
    }
};

export const obtenerRuta = async (req, res) => {
    try {
        const { origenLat, origenLng, destinoId, destinoTipo } = req.query;

        if (!origenLat || !origenLng || !destinoId) {
            return errorResponse(res, "Debes proporcionar origenLat, origenLng y destinoId", 400);
        }

        const lat = parseFloat(origenLat);
        const lng = parseFloat(origenLng);

        if (isNaN(lat) || isNaN(lng)) {
            return errorResponse(res, "Coordenadas de origen inválidas", 400);
        }

        const ruta = await calcularRuta(lat, lng, destinoId, destinoTipo || null);

        if (ruta.error) {
            return errorResponse(res, ruta.error, 404);
        }

        return successResponse(res, ruta);
    } catch (error) {
        return errorResponse(res, `Error al calcular ruta - ${error.message}`);
    }
};

export const obtenerNodosNavegacion = async (req, res) => {
    try {
        const { piso } = req.query;
        const filter = { activo: true };
        if (piso) filter.piso = parseInt(piso);

        const nodos = await Nodo.find(filter);
        return successResponse(res, nodos);
    } catch (error) {
        return errorResponse(res, `Error al obtener nodos - ${error.message}`);
    }
};

export const obtenerGrafo = async (req, res) => {
    try {
        const grafo = await obtenerGrafoCompleto();
        return successResponse(res, grafo);
    } catch (error) {
        return errorResponse(res, `Error al obtener grafo - ${error.message}`);
    }
};

export const buscarDestino = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) {
            return errorResponse(res, "Debes proporcionar un término de búsqueda", 400);
        }

        const regex = new RegExp(q, 'i');
        const aulas = await Aula.find({
            $or: [{ numero: regex }, { ubicacion: regex }, { tipo: regex }]
        }).limit(10);

        const oficinas = await Oficina.find({
            $or: [{ numero: regex }, { ubicacion: regex }, { encargado: regex }]
        }).limit(10);

        const resultados = [
            ...aulas.map(a => ({
                _id: a._id,
                nombre: `${a.tipo === 'laboratorio' ? 'Lab' : 'Aula'} ${a.numero}`,
                tipo: a.tipo,
                ubicacion: a.ubicacion,
                piso: a.piso,
                coordenadas: a.coordenadas,
                modelo: 'Aula'
            })),
            ...oficinas.map(o => ({
                _id: o._id,
                nombre: `Oficina ${o.numero}`,
                tipo: 'oficina',
                ubicacion: o.ubicacion,
                piso: o.piso,
                coordenadas: o.coordenadas,
                encargado: o.encargado,
                modelo: 'Oficina'
            }))
        ];

        return successResponse(res, resultados);
    } catch (error) {
        return errorResponse(res, `Error en búsqueda - ${error.message}`);
    }
};

export const crearNodo = async (req, res) => {
    try {
        let { nombre, tipo, coordenadas, piso, referenciaId, referenciaModelo, label, latitude, longitude } = req.body;

        if (!nombre && label) nombre = label;
        if (!coordenadas && latitude !== undefined && longitude !== undefined) {
            coordenadas = { lat: latitude, lng: longitude };
        }
        if (!tipo) tipo = "nodo";

        if (Object.values(req.body).includes("")) {
            return errorResponse(res, "Debes llenar todos los campos", 400);
        }

        const nuevoNodo = new Nodo({ nombre, tipo, coordenadas, piso, referenciaId, referenciaModelo });
        await nuevoNodo.save();
        return successResponse(res, { nodo: nuevoNodo }, "Nodo de navegación creado correctamente", 201);
    } catch (error) {
        return errorResponse(res, `Error al crear nodo - ${error.message}`);
    }
};

export const crearConexion = async (req, res) => {
    try {
        let { nodoOrigen, nodoDestino, distancia, unidireccional, tipo, from_node_id, to_node_id, weight, bidirectional, blocked } = req.body;

        if (from_node_id) nodoOrigen = from_node_id;
        if (to_node_id) nodoDestino = to_node_id;
        if (weight !== undefined) distancia = weight;
        if (bidirectional !== undefined) unidireccional = !bidirectional;
        if (blocked !== undefined) tipo = tipo || (blocked ? null : 'pasillo');

        if (!nodoOrigen || !nodoDestino || distancia === undefined) {
            return errorResponse(res, "Debes proporcionar nodoOrigen, nodoDestino y distancia", 400);
        }

        const nuevaConexion = new Conexion({ nodoOrigen, nodoDestino, distancia, unidireccional, tipo });
        await nuevaConexion.save();
        return successResponse(res, { conexion: nuevaConexion }, "Conexión creada correctamente", 201);
    } catch (error) {
        return errorResponse(res, `Error al crear conexión - ${error.message}`);
    }
};

export const subirFotoPanoramica = async (req, res) => {
    try {
        const { id } = req.params;
        const nodo = await Nodo.findById(id);
        if (!nodo) return errorResponse(res, "Nodo no encontrado", 404);

        if (!req.files?.fotoPano) {
            return errorResponse(res, "Debes subir una imagen panorámica", 400);
        }

        const { secure_url } = await subirImagenCloudinary(
            req.files.fotoPano.tempFilePath, "Panoramicas"
        );
        nodo.imagenPano = secure_url;
        await nodo.save();
        return successResponse(res, { url: secure_url, nodo }, "Foto panorámica subida");
    } catch (error) {
        return errorResponse(res, `Error - ${error.message}`);
    }
};

export const obtenerVista360 = async (req, res) => {
    try {
        const { id } = req.params;
        const nodo = await Nodo.findById(id).populate({
            path: 'hotspots.nodoDestino',
            select: 'nombre tipo coordenadas piso imagenPano'
        });
        if (!nodo) return errorResponse(res, "Nodo no encontrado", 404);
        if (!nodo.imagenPano) return errorResponse(res, "Este nodo no tiene imagen panorámica", 404);

        return successResponse(res, {
            _id: nodo._id,
            nombre: nodo.nombre,
            tipo: nodo.tipo,
            coordenadas: nodo.coordenadas,
            piso: nodo.piso,
            imagenPano: nodo.imagenPano,
            hotspots: nodo.hotspots
        });
    } catch (error) {
        return errorResponse(res, `Error al obtener vista 360 - ${error.message}`);
    }
};

export const listarNodos360 = async (req, res) => {
    try {
        const { piso } = req.query;
        const filter = { imagenPano: { $ne: null }, activo: true };
        if (piso) filter.piso = parseInt(piso);

        const nodos = await Nodo.find(filter)
            .select('nombre tipo coordenadas piso imagenPano');
        return successResponse(res, nodos);
    } catch (error) {
        return errorResponse(res, `Error al listar nodos 360 - ${error.message}`);
    }
};

export const agregarHotspot = async (req, res) => {
    try {
        const { id } = req.params;
        const { nodoDestino, pitch, yaw, texto } = req.body;

        if (!nodoDestino) {
            return errorResponse(res, "Debes proporcionar nodoDestino", 400);
        }

        const nodo = await Nodo.findById(id);
        if (!nodo) return errorResponse(res, "Nodo no encontrado", 404);

        const destinoExiste = await Nodo.findById(nodoDestino);
        if (!destinoExiste) return errorResponse(res, "Nodo de destino no encontrado", 404);

        nodo.hotspots.push({ nodoDestino, pitch: pitch || 0, yaw: yaw || 0, texto: texto || '' });
        await nodo.save();

        const nodoActualizado = await Nodo.findById(id).populate({
            path: 'hotspots.nodoDestino',
            select: 'nombre tipo coordenadas piso imagenPano'
        });

        return successResponse(res, { hotspots: nodoActualizado.hotspots }, "Hotspot agregado correctamente", 201);
    } catch (error) {
        return errorResponse(res, `Error al agregar hotspot - ${error.message}`);
    }
};

export const actualizarHotspot = async (req, res) => {
    try {
        const { nodoId, hotspotId } = req.params;
        const { nodoDestino, pitch, yaw, texto } = req.body;

        const nodo = await Nodo.findById(nodoId);
        if (!nodo) return errorResponse(res, "Nodo no encontrado", 404);

        const hotspot = nodo.hotspots.id(hotspotId);
        if (!hotspot) return errorResponse(res, "Hotspot no encontrado", 404);

        if (nodoDestino) {
            const destinoExiste = await Nodo.findById(nodoDestino);
            if (!destinoExiste) return errorResponse(res, "Nodo de destino no encontrado", 404);
            hotspot.nodoDestino = nodoDestino;
        }
        if (pitch !== undefined) hotspot.pitch = pitch;
        if (yaw !== undefined) hotspot.yaw = yaw;
        if (texto !== undefined) hotspot.texto = texto;

        await nodo.save();

        const nodoActualizado = await Nodo.findById(nodoId).populate({
            path: 'hotspots.nodoDestino',
            select: 'nombre tipo coordenadas piso imagenPano'
        });

        return successResponse(res, { hotspots: nodoActualizado.hotspots }, "Hotspot actualizado correctamente");
    } catch (error) {
        return errorResponse(res, `Error al actualizar hotspot - ${error.message}`);
    }
};

export const eliminarHotspot = async (req, res) => {
    try {
        const { nodoId, hotspotId } = req.params;

        const nodo = await Nodo.findById(nodoId);
        if (!nodo) return errorResponse(res, "Nodo no encontrado", 404);

        const hotspot = nodo.hotspots.id(hotspotId);
        if (!hotspot) return errorResponse(res, "Hotspot no encontrado", 404);

        hotspot.deleteOne();
        await nodo.save();

        const nodoActualizado = await Nodo.findById(nodoId).populate({
            path: 'hotspots.nodoDestino',
            select: 'nombre tipo coordenadas piso imagenPano'
        });

        return successResponse(res, { hotspots: nodoActualizado.hotspots }, "Hotspot eliminado correctamente");
    } catch (error) {
        return errorResponse(res, `Error al eliminar hotspot - ${error.message}`);
    }
};


