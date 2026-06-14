import Ruta from "../models/Ruta.js"
import Parada from "../models/Parada.js"
import Posicion from "../models/Posicion.js"
import { successResponse, errorResponse } from "../helpers/response.js"

export const listarRutas = async (req, res) => {
  try {
    const rutas = await Ruta.find({ activo: true }).sort({ nombre: 1 })
    return successResponse(res, rutas)
  } catch (error) {
    return errorResponse(res, error.message)
  }
}

export const listarRutasAdmin = async (req, res) => {
  try {
    const rutas = await Ruta.find().sort({ nombre: 1 })
    return successResponse(res, rutas)
  } catch (error) {
    return errorResponse(res, error.message)
  }
}

export const verRuta = async (req, res) => {
  try {
    const { id } = req.params
    const ruta = await Ruta.findById(id)
    if (!ruta) {
      return errorResponse(res, "La ruta no existe", 404)
    }
    return successResponse(res, ruta)
  } catch (error) {
    return errorResponse(res, error.message)
  }
}

export const crearRuta = async (req, res) => {
  try {
    const { nombre, descripcion, color, activo } = req.body
    if (!nombre) {
      return errorResponse(res, "Debes proporcionar el nombre de la ruta", 400)
    }
    const nuevaRuta = new Ruta({ nombre, descripcion, color, activo })
    await nuevaRuta.save()
    return successResponse(res, nuevaRuta, "Ruta creada correctamente", 201)
  } catch (error) {
    return errorResponse(res, error.message)
  }
}

export const actualizarRuta = async (req, res) => {
  try {
    const { id } = req.params
    const { nombre, descripcion, color, activo } = req.body

    const ruta = await Ruta.findById(id)
    if (!ruta) {
      return errorResponse(res, "La ruta no existe", 404)
    }

    if (nombre !== undefined) ruta.nombre = nombre
    if (descripcion !== undefined) ruta.descripcion = descripcion
    if (color !== undefined) ruta.color = color
    if (activo !== undefined) ruta.activo = activo

    await ruta.save()
    return successResponse(res, ruta, "Ruta actualizada correctamente")
  } catch (error) {
    return errorResponse(res, error.message)
  }
}

export const eliminarRuta = async (req, res) => {
  try {
    const { id } = req.params
    const ruta = await Ruta.findById(id)
    if (!ruta) {
      return errorResponse(res, "La ruta no existe", 404)
    }
    await Parada.deleteMany({ ruta_id: id })
    await Posicion.deleteMany({ ruta_id: id })
    await ruta.deleteOne()
    return successResponse(res, null, "Ruta eliminada correctamente")
  } catch (error) {
    return errorResponse(res, error.message)
  }
}

export const listarParadas = async (req, res) => {
  try {
    const { routeId } = req.params
    const paradas = await Parada.find({ ruta_id: routeId }).sort({ orden: 1 })
    return successResponse(res, paradas)
  } catch (error) {
    return errorResponse(res, error.message)
  }
}

export const crearParada = async (req, res) => {
  try {
    const { ruta_id, nombre, latitud, longitud, orden } = req.body
    if (!ruta_id || !nombre || latitud === undefined || longitud === undefined || orden === undefined) {
      return errorResponse(res, "Debes proporcionar ruta_id, nombre, latitud, longitud y orden", 400)
    }
    const nuevaParada = new Parada({ ruta_id, nombre, latitud, longitud, orden })
    await nuevaParada.save()
    return successResponse(res, nuevaParada, "Parada creada correctamente", 201)
  } catch (error) {
    return errorResponse(res, error.message)
  }
}

export const actualizarParada = async (req, res) => {
  try {
    const { id } = req.params
    const { nombre, latitud, longitud, orden } = req.body

    const parada = await Parada.findById(id)
    if (!parada) {
      return errorResponse(res, "La parada no existe", 404)
    }

    if (nombre !== undefined) parada.nombre = nombre
    if (latitud !== undefined) parada.latitud = latitud
    if (longitud !== undefined) parada.longitud = longitud
    if (orden !== undefined) parada.orden = orden

    await parada.save()
    return successResponse(res, parada, "Parada actualizada correctamente")
  } catch (error) {
    return errorResponse(res, error.message)
  }
}

export const eliminarParada = async (req, res) => {
  try {
    const { id } = req.params
    const parada = await Parada.findById(id)
    if (!parada) {
      return errorResponse(res, "La parada no existe", 404)
    }
    await parada.deleteOne()
    return successResponse(res, null, "Parada eliminada correctamente")
  } catch (error) {
    return errorResponse(res, error.message)
  }
}

export const obtenerPosiciones = async (req, res) => {
  try {
    const { routeId } = req.params
    const posiciones = await Posicion.find({ ruta_id: routeId }).sort({ updated_at: -1 })
    return successResponse(res, posiciones)
  } catch (error) {
    return errorResponse(res, error.message)
  }
}
