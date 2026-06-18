import Favorito from "../models/Favorito.js"
import { successResponse, errorResponse } from "../helpers/response.js"

const obtenerUsuario = (req) => {
  if (req.adminHeader) return { id: req.adminHeader._id.toString(), tipo: 'admin' }
  if (req.docenteHeader) return { id: req.docenteHeader._id.toString(), tipo: 'docente' }
  if (req.userHeader) return { id: req.userHeader._id.toString(), tipo: 'estudiante' }
  return null
}

export const listarFavoritos = async (req, res) => {
  try {
    const usuario = obtenerUsuario(req)
    if (!usuario) return errorResponse(res, "Usuario no autenticado", 401)

    const favoritos = await Favorito.find({ usuario_id: usuario.id }).sort({ created_at: -1 })
    return successResponse(res, favoritos)
  } catch (error) {
    return errorResponse(res, `Error al listar favoritos - ${error.message}`)
  }
}

export const crearFavorito = async (req, res) => {
  try {
    const usuario = obtenerUsuario(req)
    if (!usuario) return errorResponse(res, "Usuario no autenticado", 401)

    const { item_id, item_tipo, item_nombre, item_data } = req.body

    if (!item_id || !item_tipo || !item_nombre) {
      return errorResponse(res, "Debes proporcionar item_id, item_tipo y item_nombre", 400)
    }

    const existente = await Favorito.findOne({
      usuario_id: usuario.id,
      item_id,
      item_tipo
    })
    if (existente) {
      return errorResponse(res, "Este elemento ya está en favoritos", 400)
    }

    const favorito = new Favorito({
      usuario_id: usuario.id,
      usuario_tipo: usuario.tipo,
      item_id,
      item_tipo,
      item_nombre,
      item_data: item_data || {}
    })

    await favorito.save()
    return successResponse(res, favorito, "Favorito agregado correctamente", 201)
  } catch (error) {
    return errorResponse(res, `Error al crear favorito - ${error.message}`)
  }
}

export const eliminarFavorito = async (req, res) => {
  try {
    const usuario = obtenerUsuario(req)
    if (!usuario) return errorResponse(res, "Usuario no autenticado", 401)

    const { id } = req.params
    const favorito = await Favorito.findById(id)

    if (!favorito) return errorResponse(res, "Favorito no encontrado", 404)
    if (favorito.usuario_id !== usuario.id) {
      return errorResponse(res, "No tienes permiso para eliminar este favorito", 403)
    }

    await favorito.deleteOne()
    return successResponse(res, null, "Favorito eliminado correctamente")
  } catch (error) {
    return errorResponse(res, `Error al eliminar favorito - ${error.message}`)
  }
}
