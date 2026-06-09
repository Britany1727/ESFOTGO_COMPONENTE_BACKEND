import app from './server.js'
import connection from './database.js'
import http from 'http'
import { Server } from 'socket.io'


connection()

const server = http.createServer(app)

const io = new Server(server, {
    cors: {
        origin: ["http://localhost:5173", "http://172.31.116.73:5173"],
        methods: ["GET", "POST"],  
    }
})



io.on('connection', (socket) => {
    console.log('Usuario conectado',socket.id)
    socket.on('enviar-mensaje-front-back',(payload)=>{
        socket.broadcast.emit('enviar-mensaje-front-back',payload)
    })
})



server.listen(app.get('port'),()=>{
    console.log(`Server ok on http://172.31.116.73:${app.get('port')}`);
})
