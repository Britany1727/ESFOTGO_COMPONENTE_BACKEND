import Nodo from "../models/Nodo.js";
import Conexion from "../models/Conexion.js";

function calcularDistancia(lat1, lng1, lat2, lng2) {
    const R = 6371e3;
    const toRad = (deg) => deg * (Math.PI / 180);
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) ** 2 +
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
              Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function construirGrafo(nodos, conexiones) {
    const graph = {};
    const nodoMap = {};

    for (const nodo of nodos) {
        const id = nodo._id.toString();
        nodoMap[id] = nodo;
        graph[id] = [];
    }

    for (const conn of conexiones) {
        const desde = conn.nodoOrigen.toString();
        const hasta = conn.nodoDestino.toString();
        if (graph[desde] && graph[hasta]) {
            graph[desde].push({ nodoId: hasta, distancia: conn.distancia });
            if (!conn.unidireccional) {
                graph[hasta].push({ nodoId: desde, distancia: conn.distancia });
            }
        }
    }

    return { graph, nodoMap };
}

function dijkstra(graph, nodoMap, inicioId, finId) {
    const dist = {};
    const prev = {};
    const visited = new Set();
    const pq = [];

    for (const id of Object.keys(graph)) {
        dist[id] = Infinity;
        prev[id] = null;
    }
    dist[inicioId] = 0;
    pq.push({ id: inicioId, dist: 0 });

    while (pq.length > 0) {
        pq.sort((a, b) => a.dist - b.dist);
        const current = pq.shift();
        const currentId = current.id;

        if (visited.has(currentId)) continue;
        visited.add(currentId);

        if (currentId === finId) break;

        for (const edge of graph[currentId]) {
            if (visited.has(edge.nodoId)) continue;
            const newDist = dist[currentId] + edge.distancia;
            if (newDist < dist[edge.nodoId]) {
                dist[edge.nodoId] = newDist;
                prev[edge.nodoId] = currentId;
                pq.push({ id: edge.nodoId, dist: newDist });
            }
        }
    }

    if (dist[finId] === Infinity) return null;

    const path = [];
    let current = finId;
    while (current !== null) {
        path.unshift({
            _id: current,
            ...(nodoMap[current] ? {
                nombre: nodoMap[current].nombre,
                tipo: nodoMap[current].tipo,
                coordenadas: nodoMap[current].coordenadas,
                piso: nodoMap[current].piso,
                referenciaId: nodoMap[current].referenciaId
            } : {})
        });
        current = prev[current];
    }

    return {
        nodos: path,
        distanciaTotal: Math.round(dist[finId]),
        duracionEstimada: Math.round(dist[finId] / 1.4 / 60)
    };
}

function puntoMasCercano(nodos, lat, lng) {
    let minDist = Infinity;
    let closest = null;
    for (const nodo of nodos) {
        if (!nodo.coordenadas?.lat || !nodo.coordenadas?.lng) continue;
        const d = calcularDistancia(lat, lng, nodo.coordenadas.lat, nodo.coordenadas.lng);
        if (d < minDist) {
            minDist = d;
            closest = nodo;
        }
    }
    return closest;
}

export async function calcularRuta(origenLat, origenLng, destinoId, destinoTipo) {
    const nodos = await Nodo.find({ activo: true });
    const conexiones = await Conexion.find({ activo: true });

    const { graph, nodoMap } = construirGrafo(nodos, conexiones);

    const nodosArray = Object.values(nodoMap);

    const nodoOrigen = puntoMasCercano(nodosArray, origenLat, origenLng);

    let nodoDestino = null;
    if (destinoTipo) {
        nodoDestino = nodosArray.find(
            n => n.referenciaId?.toString() === destinoId && n.tipo === destinoTipo
        );
    }
    if (!nodoDestino) {
        nodoDestino = nodosArray.find(n => n._id.toString() === destinoId);
    }
    if (!nodoDestino) {
        nodoDestino = puntoMasCercano(nodosArray,
            ...Object.values(nodosArray.find(n => n._id.toString() === destinoId)?.coordenadas || {})
        );
    }

    if (!nodoOrigen || !nodoDestino) {
        return {
            error: "No se pudo encontrar un punto de navegación cercano",
            ruta: null
        };
    }

    if (nodoOrigen._id.toString() === nodoDestino._id.toString()) {
        return {
            nodos: [{
                ...nodoOrigen.toObject(),
                esOrigen: true,
                esDestino: true
            }],
            distanciaTotal: 0,
            duracionEstimada: 0,
            mensaje: "Ya estás en el destino"
        };
    }

    const result = dijkstra(graph, nodoMap, nodoOrigen._id.toString(), nodoDestino._id.toString());

    if (!result) {
        const directa = calcularDistancia(
            nodoOrigen.coordenadas.lat, nodoOrigen.coordenadas.lng,
            nodoDestino.coordenadas.lat, nodoDestino.coordenadas.lng
        );
        return {
            nodos: [
                { ...nodoOrigen.toObject(), esOrigen: true },
                { ...nodoDestino.toObject(), esDestino: true }
            ],
            distanciaTotal: Math.round(directa),
            duracionEstimada: Math.round(directa / 1.4 / 60),
            mensaje: "Ruta en línea recta (sin caminos definidos)"
        };
    }

    result.nodos[0].esOrigen = true;
    result.nodos[result.nodos.length - 1].esDestino = true;

    return result;
}

export async function obtenerNodosPorEdificio(edificioId) {
    return await Nodo.find({ edificioId, activo: true }).sort({ piso: 1, nombre: 1 });
}

export async function obtenerGrafoCompleto(edificioId) {
    const nodos = await Nodo.find(
        edificioId ? { edificioId, activo: true } : { activo: true }
    );
    const conexiones = await Conexion.find(
        edificioId ? { activo: true } : { activo: true }
    );

    const conexionesFiltradas = edificioId
        ? conexiones.filter(c => {
            const ids = nodos.map(n => n._id.toString());
            return ids.includes(c.nodoOrigen.toString()) && ids.includes(c.nodoDestino.toString());
          })
        : conexiones;

    return {
        nodos: nodos.map(n => ({
            _id: n._id,
            nombre: n.nombre,
            tipo: n.tipo,
            coordenadas: n.coordenadas,
            piso: n.piso,
            referenciaId: n.referenciaId,
            edificioId: n.edificioId
        })),
        conexiones: conexionesFiltradas.map(c => ({
            _id: c._id,
            nodoOrigen: c.nodoOrigen,
            nodoDestino: c.nodoDestino,
            distancia: c.distancia,
            unidireccional: c.unidireccional
        }))
    };
}
