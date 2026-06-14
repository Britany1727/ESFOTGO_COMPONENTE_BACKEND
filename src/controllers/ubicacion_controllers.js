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
