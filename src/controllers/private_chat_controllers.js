import Conversacion from "../models/Conversacion.js"
import MensajePrivado from "../models/MensajePrivado.js"
import Estudiante from "../models/Estudiante.js"
import Docente from "../models/Docente.js"
import Admin from "../models/Admin.js"
import { successResponse, errorResponse } from "../helpers/response.js"
import { getIO } from "../helpers/socket.js"

const obtenerUsuario = (req) => {
  if (req.adminHeader) return { id: req.adminHeader._id.toString(), tipo: 'admin' }
  if (req.docenteHeader) return { id: req.docenteHeader._id.toString(), tipo: 'docente' }
  if (req.userHeader) return { id: req.userHeader._id.toString(), tipo: 'estudiante' }
  return null
}

const buscarNombresUsuarios = async (ids) => {
  const nombres = {}
  const idsUnicos = [...new Set(ids)]

  const estudiantes = await Estudiante.find({ _id: { $in: idsUnicos } }).select('nombre apellido').lean()
  for (const e of estudiantes) {
    nombres[e._id.toString()] = `${e.nombre}${e.apellido ? ' ' + e.apellido : ''}`
  }

  const docentes = await Docente.find({ _id: { $in: idsUnicos } }).select('nombre apellido').lean()
  for (const d of docentes) {
    nombres[d._id.toString()] = `${d.nombre}${d.apellido ? ' ' + d.apellido : ''}`
  }

  const admins = await Admin.find({ _id: { $in: idsUnicos } }).select('nombre apellido').lean()
  for (const a of admins) {
    nombres[a._id.toString()] = `${a.nombre}${a.apellido ? ' ' + a.apellido : ''}`
  }

  return nombres
}

export const getOrCreateConversation = async (req, res) => {
  try {
    const { participantIds } = req.body
    if (!participantIds || participantIds.length < 2) {
      return errorResponse(res, "Debes proporcionar al menos 2 participantIds", 400)
    }

    const sorted = [...participantIds].sort()
    let conversacion = await Conversacion.findOne({
      participantIds: { $all: sorted, $size: sorted.length }
    })

    if (!conversacion) {
      conversacion = new Conversacion({ participantIds: sorted })
      await conversacion.save()
    }

    const participantNames = await buscarNombresUsuarios(conversacion.participantIds)

    return successResponse(res, {
      _id: conversacion._id,
      participantIds: conversacion.participantIds,
      participantNames,
      lastMessage: conversacion.lastMessage,
      lastMessageAt: conversacion.lastMessageAt
    })
  } catch (error) {
    return errorResponse(res, `Error al crear/obtener conversación - ${error.message}`)
  }
}

export const getConversations = async (req, res) => {
  try {
    const usuario = obtenerUsuario(req)
    if (!usuario) return errorResponse(res, "Usuario no autenticado", 401)

    const conversaciones = await Conversacion.find({
      participantIds: usuario.id
    }).sort({ lastMessageAt: -1, created_at: -1 })

    const allParticipantIds = conversaciones.flatMap(c => c.participantIds)
    const participantNames = await buscarNombresUsuarios(allParticipantIds)

    const result = conversaciones.map(c => ({
      _id: c._id,
      participantIds: c.participantIds,
      participantNames,
      lastMessage: c.lastMessage,
      lastMessageAt: c.lastMessageAt
    }))

    return successResponse(res, result)
  } catch (error) {
    return errorResponse(res, `Error al listar conversaciones - ${error.message}`)
  }
}

export const getConversationMessages = async (req, res) => {
  try {
    const { id } = req.params
    const messages = await MensajePrivado.find({ conversationId: id }).sort({ timestamp: 1 }).limit(200)
    return successResponse(res, messages)
  } catch (error) {
    return errorResponse(res, `Error al obtener mensajes - ${error.message}`)
  }
}

export const sendPrivateMessage = async (req, res) => {
  try {
    const { conversationId, senderId, senderName, text } = req.body
    if (!conversationId || !senderId || !senderName || !text) {
      return errorResponse(res, "Debes proporcionar conversationId, senderId, senderName y text", 400)
    }

    const mensaje = new MensajePrivado({ conversationId, senderId, senderName, text })
    await mensaje.save()

    await Conversacion.findByIdAndUpdate(conversationId, {
      lastMessage: text,
      lastMessageAt: mensaje.timestamp
    })

    try {
      getIO().to(`conv-${conversationId}`).emit('mensaje-privado-recibido', {
        _id: mensaje._id,
        conversationId: mensaje.conversationId,
        senderId: mensaje.senderId,
        senderName: mensaje.senderName,
        text: mensaje.text,
        timestamp: mensaje.timestamp
      })
    } catch (err) {
      console.error('Error al emitir mensaje privado por socket:', err.message)
    }

    return successResponse(res, mensaje, "Mensaje enviado", 201)
  } catch (error) {
    return errorResponse(res, `Error al enviar mensaje privado - ${error.message}`)
  }
}
