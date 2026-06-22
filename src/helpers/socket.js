import { Server } from 'socket.io'
import Mensaje from '../models/Mensaje.js'
import MensajePrivado from '../models/MensajePrivado.js'
import Conversacion from '../models/Conversacion.js'

let io = null

export function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: ["http://localhost:5173", "http://172.31.116.73:5173", "http://127.0.0.1:5173"],
      methods: ["GET", "POST"],
    }
  })

  const usuariosConectados = new Map()

  io.on('connection', (socket) => {
    console.log('Usuario conectado', socket.id)

    socket.on('usuario-conectado', (userData) => {
      const { _id, nombre, email, rol } = userData || {}
      const userInfo = {
        socketId: socket.id,
        userId: _id || null,
        nombre: nombre || 'Anónimo',
        email: email || '',
        rol: rol || 'invitado'
      }
      usuariosConectados.set(socket.id, userInfo)
      socket.broadcast.emit('usuario-conectado', userInfo)
      io.emit('usuarios-online', Array.from(usuariosConectados.values()))
    })

    // === Chat público (solo admin/docente) ===
    socket.on('enviar-mensaje', async (payload) => {
      const { text, from, room } = payload
      if (!text || !from) return

      const userInfo = usuariosConectados.get(socket.id)
      if (!userInfo || !['admin', 'docente'].includes(userInfo.rol)) return

      try {
        const nuevoMensaje = new Mensaje({
          text,
          from,
          room: room || 'general',
          senderId: userInfo.userId,
          senderRol: userInfo.rol
        })
        await nuevoMensaje.save()

        io.emit('mensaje-recibido', {
          _id: nuevoMensaje._id,
          text: nuevoMensaje.text,
          from: nuevoMensaje.from,
          timestamp: nuevoMensaje.timestamp,
          room: nuevoMensaje.room,
          senderId: nuevoMensaje.senderId,
          senderRol: nuevoMensaje.senderRol
        })
      } catch (error) {
        console.error('Error al guardar mensaje:', error.message)
      }
    })

    // === Chat privado ===
    socket.on('unirse-conversacion', (conversationId) => {
      if (!conversationId) return
      socket.join(`conv-${conversationId}`)
      console.log(`Socket ${socket.id} unido a conversación ${conversationId}`)
    })

    socket.on('salir-conversacion', (conversationId) => {
      if (!conversationId) return
      socket.leave(`conv-${conversationId}`)
      console.log(`Socket ${socket.id} salió de conversación ${conversationId}`)
    })

    socket.on('enviar-mensaje-privado', async (payload) => {
      const { conversationId, senderId, senderName, text } = payload
      if (!conversationId || !senderId || !senderName || !text) return

      try {
        const mensaje = new MensajePrivado({ conversationId, senderId, senderName, text })
        await mensaje.save()

        await Conversacion.findByIdAndUpdate(conversationId, {
          lastMessage: text,
          lastMessageAt: mensaje.timestamp
        })

        io.to(`conv-${conversationId}`).emit('mensaje-privado-recibido', {
          _id: mensaje._id,
          conversationId: mensaje.conversationId,
          senderId: mensaje.senderId,
          senderName: mensaje.senderName,
          text: mensaje.text,
          timestamp: mensaje.timestamp
        })
      } catch (error) {
        console.error('Error al guardar mensaje privado:', error.message)
      }
    })

    socket.on('disconnect', () => {
      console.log('Usuario desconectado', socket.id)
      const userData = usuariosConectados.get(socket.id)
      usuariosConectados.delete(socket.id)
      if (userData) {
        socket.broadcast.emit('usuario-desconectado', userData)
      }
      io.emit('usuarios-online', Array.from(usuariosConectados.values()))
    })
  })

  return io
}

export function getIO() {
  if (!io) throw new Error('Socket.IO no ha sido inicializado')
  return io
}
