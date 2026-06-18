import Mensaje from "../models/Mensaje.js"
import { successResponse, errorResponse } from "../helpers/response.js"

export const getMessages = async (req, res) => {
  try {
    const { room } = req.query
    const filter = room ? { room } : {}
    const messages = await Mensaje.find(filter).sort({ timestamp: 1 }).limit(200)
    return successResponse(res, messages)
  } catch (error) {
    return errorResponse(res, `Error al obtener mensajes - ${error.message}`)
  }
}

export const sendMessage = async (req, res) => {
  try {
    const { room, from, text } = req.body
    if (!from || !text) {
      return errorResponse(res, "Debes proporcionar from y text", 400)
    }
    const mensaje = new Mensaje({ text, from, room: room || 'general' })
    await mensaje.save()
    return successResponse(res, mensaje, "Mensaje enviado", 201)
  } catch (error) {
    return errorResponse(res, `Error al enviar mensaje - ${error.message}`)
  }
}
