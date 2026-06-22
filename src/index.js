import app from './server.js'
import connection from './database.js'
import http from 'http'
import { initSocket } from './helpers/socket.js'

connection()

const server = http.createServer(app)
initSocket(server)

server.listen(app.get('port'), () => {
  console.log(`Server ok on http://172.31.116.73:${app.get('port')}`)
})
