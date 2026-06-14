import Nodo from "../models/Nodo.js"
import Conexion from "../models/Conexion.js"
import { successResponse, errorResponse } from "../helpers/response.js"

export const listarAristas = async (req, res) => {
  try {
    const { edificioId } = req.query
    const filter = { activo: true }
    if (edificioId) {
      const nodos = await Nodo.find({ edificioId }).select('_id')
      const nodoIds = nodos.map(n => n._id)
      filter.$or = [
        { nodoOrigen: { $in: nodoIds } },
        { nodoDestino: { $in: nodoIds } }
      ]
    }
    const aristas = await Conexion.find(filter)
      .populate('nodoOrigen', 'nombre tipo coordenadas piso')
      .populate('nodoDestino', 'nombre tipo coordenadas piso')
    return successResponse(res, aristas)
  } catch (error) {
    return errorResponse(res, error.message)
  }
}

export const eliminarNodo = async (req, res) => {
  try {
    const { id } = req.params
    const nodo = await Nodo.findById(id)
    if (!nodo) {
      return errorResponse(res, "El nodo no existe", 404)
    }
    await Conexion.deleteMany({
      $or: [{ nodoOrigen: id }, { nodoDestino: id }]
    })
    await nodo.deleteOne()
    return successResponse(res, null, "Nodo eliminado correctamente")
  } catch (error) {
    return errorResponse(res, error.message)
  }
}

export const actualizarArista = async (req, res) => {
  try {
    const { id } = req.params
    const { distancia, unidireccional, tipo, activo } = req.body

    const arista = await Conexion.findById(id)
    if (!arista) {
      return errorResponse(res, "La arista no existe", 404)
    }

    if (distancia !== undefined) arista.distancia = distancia
    if (unidireccional !== undefined) arista.unidireccional = unidireccional
    if (tipo !== undefined) arista.tipo = tipo
    if (activo !== undefined) arista.activo = activo

    await arista.save()
    return successResponse(res, arista, "Arista actualizada correctamente")
  } catch (error) {
    return errorResponse(res, error.message)
  }
}

export const eliminarArista = async (req, res) => {
  try {
    const { id } = req.params
    const arista = await Conexion.findById(id)
    if (!arista) {
      return errorResponse(res, "La arista no existe", 404)
    }
    await arista.deleteOne()
    return successResponse(res, null, "Arista eliminada correctamente")
  } catch (error) {
    return errorResponse(res, error.message)
  }
}
