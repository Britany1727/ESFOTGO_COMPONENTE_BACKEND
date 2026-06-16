import app from './server.js'
import connection from './database.js'
import http from 'http'
import { Server } from 'socket.io'
import Mensaje from './models/Mensaje.js'

connection()

const server = http.createServer(app)

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "http://172.31.116.73:5173", "http://127.0.0.1:5173"],
    methods: ["GET", "POST"],
  }
})

const usuariosConectados = new Map()

io.on('connection', (socket) => {
  console.log('Usuario conectado', socket.id)

  socket.on('usuario-conectado', (userData) => {
    const { nombre, email, rol } = userData || {}
    const userInfo = {
      socketId: socket.id,
      nombre: nombre || 'Anónimo',
      email: email || '',
      rol: rol || 'invitado'
    }
    usuariosConectados.set(socket.id, userInfo)
    socket.broadcast.emit('usuario-conectado', userInfo)
    io.emit('usuarios-online', Array.from(usuariosConectados.values()))
  })

  socket.on('enviar-mensaje', async (payload) => {
    const { text, from, room } = payload
    if (!text || !from) return

    try {
      const nuevoMensaje = new Mensaje({ text, from, room: room || 'general' })
      await nuevoMensaje.save()

      io.emit('mensaje-recibido', {
        _id: nuevoMensaje._id,
        text: nuevoMensaje.text,
        from: nuevoMensaje.from,
        timestamp: nuevoMensaje.timestamp,
        room: nuevoMensaje.room
      })
    } catch (error) {
      console.error('Error al guardar mensaje:', error.message)
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

server.listen(app.get('port'), () => {
  console.log(`Server ok on http://172.31.116.73:${app.get('port')}`)
})
