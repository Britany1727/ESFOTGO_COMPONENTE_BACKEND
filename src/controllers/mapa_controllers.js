import Edificio from "../models/Edificio.js";
import Aula from "../models/Aulas.js";
import Oficina from "../models/Oficinas.js";
import Evento from "../models/Evento.js";
import Nodo from "../models/Nodo.js";
import Conexion from "../models/Conexion.js";
import { calcularRuta, obtenerNodosPorEdificio, obtenerGrafoCompleto } from "../services/routing.service.js";
import { subirImagenCloudinary } from "../helpers/uploadCloudinary.js"; 

export const obtenerAreaEsfot = async (req, res) => {
    try {
        const edificios = await Edificio.find().select('nombre codigo centro poligono pisos imagen descripcion');
        const poligonos = edificios.map(e => ({
            _id: e._id,
            nombre: e.nombre,
            codigo: e.codigo,
            centro: e.centro,
            poligono: e.poligono,
            pisos: e.pisos,
            imagen: e.imagen,
            descripcion: e.descripcion
        }));
        res.status(200).json(poligonos);
    } catch (error) {
        res.status(500).json({ msg: `Error al obtener el área de ESFOT - ${error.message}` });
    }
};

export const obtenerPuntosMapa = async (req, res) => {
    try {
        const aulas = await Aula.find().populate('edificio', 'nombre codigo');
        const oficinas = await Oficina.find().populate('edificio', 'nombre codigo');
        const eventos = await Evento.find({ fecha: { $gte: new Date() } }).populate('edificio', 'nombre codigo');

        const puntos = [
            ...aulas.map(a => ({
                _id: a._id,
                nombre: `Aula ${a.numero}`,
                tipo: a.tipo,
                ubicacion: a.ubicacion,
                piso: a.piso,
                coordenadas: a.coordenadas,
                edificio: a.edificio,
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
                edificio: o.edificio,
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

        res.status(200).json(puntos);
    } catch (error) {
        res.status(500).json({ msg: `Error al obtener puntos del mapa - ${error.message}` });
    }
};

export const obtenerRuta = async (req, res) => {
    try {
        const { origenLat, origenLng, destinoId, destinoTipo } = req.query;

        if (!origenLat || !origenLng || !destinoId) {
            return res.status(400).json({
                msg: "Debes proporcionar origenLat, origenLng y destinoId"
            });
        }

        const lat = parseFloat(origenLat);
        const lng = parseFloat(origenLng);

        if (isNaN(lat) || isNaN(lng)) {
            return res.status(400).json({ msg: "Coordenadas de origen inválidas" });
        }

        const ruta = await calcularRuta(lat, lng, destinoId, destinoTipo || null);

        if (ruta.error) {
            return res.status(404).json({ msg: ruta.error });
        }

        res.status(200).json(ruta);
    } catch (error) {
        res.status(500).json({ msg: `Error al calcular ruta - ${error.message}` });
    }
};

export const obtenerNodosNavegacion = async (req, res) => {
    try {
        const { edificioId, piso } = req.query;
        const filter = { activo: true };
        if (edificioId) filter.edificioId = edificioId;
        if (piso) filter.piso = parseInt(piso);

        const nodos = await Nodo.find(filter).populate('edificioId', 'nombre codigo');
        res.status(200).json(nodos);
    } catch (error) {
        res.status(500).json({ msg: `Error al obtener nodos - ${error.message}` });
    }
};

export const obtenerGrafo = async (req, res) => {
    try {
        const { edificioId } = req.query;
        const grafo = await obtenerGrafoCompleto(edificioId || null);
        res.status(200).json(grafo);
    } catch (error) {
        res.status(500).json({ msg: `Error al obtener grafo - ${error.message}` });
    }
};

export const buscarDestino = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) {
            return res.status(400).json({ msg: "Debes proporcionar un término de búsqueda" });
        }

        const regex = new RegExp(q, 'i');

        const aulas = await Aula.find({
            $or: [
                { numero: regex },
                { ubicacion: regex },
                { tipo: regex }
            ]
        }).populate('edificio', 'nombre codigo').limit(10);

        const oficinas = await Oficina.find({
            $or: [
                { numero: regex },
                { ubicacion: regex },
                { encargado: regex }
            ]
        }).populate('edificio', 'nombre codigo').limit(10);

        const resultados = [
            ...aulas.map(a => ({
                _id: a._id,
                nombre: `${a.tipo === 'laboratorio' ? 'Lab' : 'Aula'} ${a.numero}`,
                tipo: a.tipo,
                ubicacion: a.ubicacion,
                piso: a.piso,
                coordenadas: a.coordenadas,
                edificio: a.edificio?.nombre || '',
                modelo: 'Aula'
            })),
            ...oficinas.map(o => ({
                _id: o._id,
                nombre: `Oficina ${o.numero}`,
                tipo: 'oficina',
                ubicacion: o.ubicacion,
                piso: o.piso,
                coordenadas: o.coordenadas,
                edificio: o.edificio?.nombre || '',
                encargado: o.encargado,
                modelo: 'Oficina'
            }))
        ];

        res.status(200).json(resultados);
    } catch (error) {
        res.status(500).json({ msg: `Error en búsqueda - ${error.message}` });
    }
};

export const crearNodo = async (req, res) => {
    try {
        const { nombre, tipo, coordenadas, piso, edificioId, referenciaId, referenciaModelo } = req.body;

        if (Object.values(req.body).includes("")) {
            return res.status(400).json({ msg: "Debes llenar todos los campos" });
        }

        const nuevoNodo = new Nodo({ nombre, tipo, coordenadas, piso, edificioId, referenciaId, referenciaModelo });
        await nuevoNodo.save();
        res.status(200).json({ msg: "Nodo de navegación creado correctamente", nodo: nuevoNodo });
    } catch (error) {
        res.status(500).json({ msg: `Error al crear nodo - ${error.message}` });
    }
};

export const crearConexion = async (req, res) => {
    try {
        const { nodoOrigen, nodoDestino, distancia, unidireccional, tipo } = req.body;

        if (!nodoOrigen || !nodoDestino || !distancia) {
            return res.status(400).json({ msg: "Debes proporcionar nodoOrigen, nodoDestino y distancia" });
        }

        const nuevaConexion = new Conexion({ nodoOrigen, nodoDestino, distancia, unidireccional, tipo });
        await nuevaConexion.save();
        res.status(200).json({ msg: "Conexión creada correctamente", conexion: nuevaConexion });
    } catch (error) {
        res.status(500).json({ msg: `Error al crear conexión - ${error.message}` });
    }
};

export const crearEdificio = async (req, res) => {
    try {
        const { nombre, codigo, descripcion, centro, poligono, pisos } = req.body;

        if (!nombre || !codigo || !centro || !poligono) {
            return res.status(400).json({ msg: "Debes proporcionar nombre, codigo, centro y poligono" });
        }

        const existente = await Edificio.findOne({ codigo });
        if (existente) {
            return res.status(400).json({ msg: "El código del edificio ya existe" });
        }

        const nuevoEdificio = new Edificio({ nombre, codigo, descripcion, centro, poligono, pisos });
        await nuevoEdificio.save();
        res.status(200).json({ msg: "Edificio creado correctamente", edificio: nuevoEdificio });
    } catch (error) {
        res.status(500).json({ msg: `Error al crear edificio - ${error.message}` });
    }
};

export const listarEdificios = async (req, res) => {
    try {
        const edificios = await Edificio.find().sort({ nombre: 1 });
        res.status(200).json(edificios);
    } catch (error) {
        res.status(500).json({ msg: `Error al listar edificios - ${error.message}` });
    }
};

export const verEdificio = async (req, res) => {
    try {
        const { id } = req.params;
        const edificio = await Edificio.findById(id);
        if (!edificio) return res.status(404).json({ msg: "El edificio no existe" });
        res.status(200).json(edificio);
    } catch (error) {
        res.status(500).json({ msg: `Error al ver edificio - ${error.message}` });
    }
};

export const actualizarEdificio = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, descripcion, centro, poligono, pisos, imagen } = req.body;

        const edificio = await Edificio.findById(id);
        if (!edificio) return res.status(404).json({ msg: "El edificio no existe" });

        if (nombre) edificio.nombre = nombre;
        if (descripcion) edificio.descripcion = descripcion;
        if (centro) edificio.centro = centro;
        if (poligono) edificio.poligono = poligono;
        if (pisos) edificio.pisos = pisos;
        if (imagen) edificio.imagen = imagen;

        await edificio.save();
        res.status(200).json({ msg: "Edificio actualizado correctamente", edificio });
    } catch (error) {
        res.status(500).json({ msg: `Error al actualizar edificio - ${error.message}` });
    }
};

export const eliminarEdificio = async (req, res) => {
    try {
        const { id } = req.params;
        const edificio = await Edificio.findById(id);
        if (!edificio) return res.status(404).json({ msg: "El edificio no existe" });

        await Nodo.updateMany({ edificioId: id }, { activo: false });
        await edificio.deleteOne();
        res.status(200).json({ msg: "Edificio eliminado correctamente" });
    } catch (error) {
        res.status(500).json({ msg: `Error al eliminar edificio - ${error.message}` });
    }
};

export const subirFotoPanoramica = async (req, res) => {
    try {
        const { id } = req.params;
        const nodo = await Nodo.findById(id);
        if (!nodo) return res.status(404).json({ msg: "Nodo no encontrado" });

        if (!req.files?.fotoPano) {
            return res.status(400).json({ msg: "Debes subir una imagen panorámica" });
        }

        const { secure_url } = await subirImagenCloudinary(
            req.files.fotoPano.tempFilePath, "Panoramicas"
        );
        nodo.imagenPano = secure_url;
        await nodo.save();
        res.status(200).json({ msg: "Foto panorámica subida", url: secure_url, nodo });
    } catch (error) {
        res.status(500).json({ msg: `Error - ${error.message}` });
    }
};

export const obtenerVista360 = async (req, res) => {
    try {
        const { id } = req.params;
        const nodo = await Nodo.findById(id).populate({
            path: 'hotspots.nodoDestino',
            select: 'nombre tipo coordenadas piso imagenPano edificioId',
            populate: { path: 'edificioId', select: 'nombre codigo' }
        });
        if (!nodo) return res.status(404).json({ msg: "Nodo no encontrado" });
        if (!nodo.imagenPano) return res.status(404).json({ msg: "Este nodo no tiene imagen panorámica" });

        res.status(200).json({
            _id: nodo._id,
            nombre: nodo.nombre,
            tipo: nodo.tipo,
            coordenadas: nodo.coordenadas,
            piso: nodo.piso,
            edificioId: nodo.edificioId,
            imagenPano: nodo.imagenPano,
            hotspots: nodo.hotspots
        });
    } catch (error) {
        res.status(500).json({ msg: `Error al obtener vista 360 - ${error.message}` });
    }
};

export const listarNodos360 = async (req, res) => {
    try {
        const { edificioId, piso } = req.query;
        const filter = { imagenPano: { $ne: null }, activo: true };
        if (edificioId) filter.edificioId = edificioId;
        if (piso) filter.piso = parseInt(piso);

        const nodos = await Nodo.find(filter)
            .select('nombre tipo coordenadas piso edificioId imagenPano')
            .populate('edificioId', 'nombre codigo');
        res.status(200).json(nodos);
    } catch (error) {
        res.status(500).json({ msg: `Error al listar nodos 360 - ${error.message}` });
    }
};

export const agregarHotspot = async (req, res) => {
    try {
        const { id } = req.params;
        const { nodoDestino, pitch, yaw, texto } = req.body;

        if (!nodoDestino) {
            return res.status(400).json({ msg: "Debes proporcionar nodoDestino" });
        }

        const nodo = await Nodo.findById(id);
        if (!nodo) return res.status(404).json({ msg: "Nodo no encontrado" });

        const destinoExiste = await Nodo.findById(nodoDestino);
        if (!destinoExiste) return res.status(404).json({ msg: "Nodo de destino no encontrado" });

        nodo.hotspots.push({ nodoDestino, pitch: pitch || 0, yaw: yaw || 0, texto: texto || '' });
        await nodo.save();

        const nodoActualizado = await Nodo.findById(id).populate({
            path: 'hotspots.nodoDestino',
            select: 'nombre tipo coordenadas piso imagenPano'
        });

        res.status(200).json({ msg: "Hotspot agregado correctamente", hotspots: nodoActualizado.hotspots });
    } catch (error) {
        res.status(500).json({ msg: `Error al agregar hotspot - ${error.message}` });
    }
};

export const actualizarHotspot = async (req, res) => {
    try {
        const { nodoId, hotspotId } = req.params;
        const { nodoDestino, pitch, yaw, texto } = req.body;

        const nodo = await Nodo.findById(nodoId);
        if (!nodo) return res.status(404).json({ msg: "Nodo no encontrado" });

        const hotspot = nodo.hotspots.id(hotspotId);
        if (!hotspot) return res.status(404).json({ msg: "Hotspot no encontrado" });

        if (nodoDestino) {
            const destinoExiste = await Nodo.findById(nodoDestino);
            if (!destinoExiste) return res.status(404).json({ msg: "Nodo de destino no encontrado" });
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

        res.status(200).json({ msg: "Hotspot actualizado correctamente", hotspots: nodoActualizado.hotspots });
    } catch (error) {
        res.status(500).json({ msg: `Error al actualizar hotspot - ${error.message}` });
    }
};

export const eliminarHotspot = async (req, res) => {
    try {
        const { nodoId, hotspotId } = req.params;

        const nodo = await Nodo.findById(nodoId);
        if (!nodo) return res.status(404).json({ msg: "Nodo no encontrado" });

        const hotspot = nodo.hotspots.id(hotspotId);
        if (!hotspot) return res.status(404).json({ msg: "Hotspot no encontrado" });

        hotspot.deleteOne();
        await nodo.save();

        const nodoActualizado = await Nodo.findById(nodoId).populate({
            path: 'hotspots.nodoDestino',
            select: 'nombre tipo coordenadas piso imagenPano'
        });

        res.status(200).json({ msg: "Hotspot eliminado correctamente", hotspots: nodoActualizado.hotspots });
    } catch (error) {
        res.status(500).json({ msg: `Error al eliminar hotspot - ${error.message}` });
    }
};
