import Ubicacion from "../models/Ubicacion.js"
import { successResponse, errorResponse } from "../helpers/response.js"

export const listarUbicaciones = async (req, res) => {
  try {
    const ubicaciones = await Ubicacion.find().sort({ created_at: -1 })
    return successResponse(res, ubicaciones)
  } catch (error) {
    return errorResponse(res, error.message)
  }
}

export const listarUbicacionesPorCategoria = async (req, res) => {
  try {
    const { category } = req.params
    if (!category) {
      return errorResponse(res, "Debes proporcionar una categoría", 400)
    }
    const ubicaciones = await Ubicacion.find({
      categoria: { $regex: new RegExp(`^${category}$`, 'i') }
    }).sort({ created_at: -1 })
    return successResponse(res, ubicaciones)
  } catch (error) {
    return errorResponse(res, error.message)
  }
}

export const verUbicacion = async (req, res) => {
  try {
    const { id } = req.params
    const ubicacion = await Ubicacion.findById(id)
    if (!ubicacion) {
      return errorResponse(res, "La ubicación no existe", 404)
    }
    return successResponse(res, ubicacion)
  } catch (error) {
    return errorResponse(res, error.message)
  }
}

export const crearUbicacion = async (req, res) => {
  try {
    const { nombre, descripcion, categoria, latitud, longitud, imagen } = req.body
    if (!nombre || !categoria || latitud === undefined || longitud === undefined) {
      return errorResponse(res, "Debes proporcionar nombre, categoria, latitud y longitud", 400)
    }
    const nuevaUbicacion = new Ubicacion({ nombre, descripcion, categoria, latitud, longitud, imagen })
    await nuevaUbicacion.save()
    return successResponse(res, nuevaUbicacion, "Ubicación creada correctamente", 201)
  } catch (error) {
    return errorResponse(res, error.message)
  }
}

export const actualizarUbicacion = async (req, res) => {
  try {
    const { id } = req.params
    const { nombre, descripcion, categoria, latitud, longitud, imagen } = req.body

    const ubicacion = await Ubicacion.findById(id)
    if (!ubicacion) {
      return errorResponse(res, "La ubicación no existe", 404)
    }

    if (nombre !== undefined) ubicacion.nombre = nombre
    if (descripcion !== undefined) ubicacion.descripcion = descripcion
    if (categoria !== undefined) ubicacion.categoria = categoria
    if (latitud !== undefined) ubicacion.latitud = latitud
    if (longitud !== undefined) ubicacion.longitud = longitud
    if (imagen !== undefined) ubicacion.imagen = imagen

    await ubicacion.save()
    return successResponse(res, ubicacion, "Ubicación actualizada correctamente")
  } catch (error) {
    return errorResponse(res, error.message)
  }
}

export const eliminarUbicacion = async (req, res) => {
  try {
    const { id } = req.params
    const ubicacion = await Ubicacion.findById(id)
    if (!ubicacion) {
      return errorResponse(res, "La ubicación no existe", 404)
    }
    await ubicacion.deleteOne()
    return successResponse(res, null, "Ubicación eliminada correctamente")
  } catch (error) {
    return errorResponse(res, error.message)
  }
}
