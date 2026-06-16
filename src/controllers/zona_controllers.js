import Zona from "../models/Zona.js"
import { successResponse, errorResponse } from "../helpers/response.js"

export const listarZonas = async (req, res) => {
  try {
    const zonas = await Zona.find().sort({ nombre: 1 })
    return successResponse(res, zonas)
  } catch (error) {
    return errorResponse(res, error.message)
  }
}

export const crearZona = async (req, res) => {
  try {
    const { nombre, descripcion, coordenadas, fill_color, stroke_color, activo } = req.body
    if (!nombre || !coordenadas || coordenadas.length === 0) {
      return errorResponse(res, "Debes proporcionar nombre y coordenadas", 400)
    }
    const nuevaZona = new Zona({ nombre, descripcion, coordenadas, fill_color, stroke_color, activo })
    await nuevaZona.save()
    return successResponse(res, nuevaZona, "Zona creada correctamente", 201)
  } catch (error) {
    return errorResponse(res, error.message)
  }
}

export const actualizarZona = async (req, res) => {
  try {
    const { id } = req.params
    const { nombre, descripcion, coordenadas, fill_color, stroke_color, activo } = req.body

    const zona = await Zona.findById(id)
    if (!zona) {
      return errorResponse(res, "La zona no existe", 404)
    }

    if (nombre !== undefined) zona.nombre = nombre
    if (descripcion !== undefined) zona.descripcion = descripcion
    if (coordenadas !== undefined) zona.coordenadas = coordenadas
    if (fill_color !== undefined) zona.fill_color = fill_color
    if (stroke_color !== undefined) zona.stroke_color = stroke_color
    if (activo !== undefined) zona.activo = activo

    await zona.save()
    return successResponse(res, zona, "Zona actualizada correctamente")
  } catch (error) {
    return errorResponse(res, error.message)
  }
}

export const eliminarZona = async (req, res) => {
  try {
    const { id } = req.params
    const zona = await Zona.findById(id)
    if (!zona) {
      return errorResponse(res, "La zona no existe", 404)
    }
    await zona.deleteOne()
    return successResponse(res, null, "Zona eliminada correctamente")
  } catch (error) {
    return errorResponse(res, error.message)
  }
}
