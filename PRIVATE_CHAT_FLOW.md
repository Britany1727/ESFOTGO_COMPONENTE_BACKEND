# Chat Privado — Flujo Frontend

## Arquitectura general

```
FRONTEND                          BACKEND
   |                                |
   |---- REST (fetch/axios) ------>|  Obtener/crear conversaciones
   |                                |  Historial de mensajes
   |                                |
   |---- Socket.IO (ws) ---------->|  Enviar/recibir mensajes en tiempo real
   |<--- Socket.IO (evento) -------|
```

El frontend usa **REST** para operaciones CRUD (listar conversaciones, obtener historial) y **Socket.IO** para la mensajería en tiempo real.

---

## Endpoints REST

### 1. Obtener o crear una conversación

```
POST /api/chat/conversation
Headers: Authorization: Bearer <token>
Body: {
  "participantIds": ["id_user1", "id_user2"]
}
```

Respuesta:
```json
{
  "_id": "conv_id",
  "participantIds": ["id_user1", "id_user2"],
  "participantNames": {
    "id_user1": "Juan Pérez",
    "id_user2": "María López"
  },
  "lastMessage": null,
  "lastMessageAt": null
}
```

### 2. Listar conversaciones del usuario autenticado

```
GET /api/chat/conversations
Headers: Authorization: Bearer <token>
```

### 3. Obtener historial de mensajes de una conversación

```
GET /api/chat/conversation/:id/messages
```

### 4. Enviar mensaje privado (vía REST, opcional)

```
POST /api/chat/private-message
Body: {
  "conversationId": "conv_id",
  "senderId": "id_user",
  "senderName": "Juan Pérez",
  "text": "Hola!"
}
```

> También se puede enviar por Socket.IO (ver sección de sockets).

---

## Socket.IO — Eventos en tiempo real

### Conexión inicial

```js
import { io as socketClient } from 'socket.io-client'

const socket = socketClient('http://172.31.116.73:4000', {
  transports: ['websocket']
})
```

### 1. Identificar usuario en el socket

Después de conectar, el frontend **debe** emitir `usuario-conectado` con los datos del usuario autenticado:

```js
socket.emit('usuario-conectado', {
  _id: usuario._id,
  nombre: usuario.nombre,
  email: usuario.email,
  rol: usuario.rol
})
```

Esto permite que el backend sepa quién está conectado y notifique a los demás.

### 2. Unirse a una conversación

Cuando el usuario abre una ventana de chat privado, **debe** unirse a la sala de esa conversación para recibir los mensajes en tiempo real:

```js
socket.emit('unirse-conversacion', conversationId)
```

### 3. Salir de una conversación

Cuando el usuario cierra/abandona la ventana de chat:

```js
socket.emit('salir-conversacion', conversationId)
```

### 4. Enviar un mensaje privado (por socket — recomendado)

```js
socket.emit('enviar-mensaje-privado', {
  conversationId: "conv_id",
  senderId: "id_user",
  senderName: "Juan Pérez",
  text: "Hola, ¿cómo estás?"
})
```

El backend guarda el mensaje en MongoDB y emite el evento `mensaje-privado-recibido` a todos los sockets dentro de la sala `conv-<id>`.

### 5. Recibir un mensaje privado en tiempo real

El frontend debe escuchar el evento `mensaje-privado-recibido`:

```js
socket.on('mensaje-privado-recibido', (mensaje) => {
  // mensaje = {
  //   _id: "msg_id",
  //   conversationId: "conv_id",
  //   senderId: "id_user",
  //   senderName: "Juan Pérez",
  //   text: "Hola, ¿cómo estás?",
  //   timestamp: "2026-06-21T12:00:00.000Z"
  // }

  // Agregar el mensaje al estado local del chat
  setMessages(prev => [...prev, mensaje])
})
```

---

## Flujo completo recomendado

```
1. El usuario inicia sesión → obtiene su _id, nombre, rol, token JWT

2. Conecta Socket.IO y emite 'usuario-conectado' con sus datos

3. Para chatear con alguien:
   a. Llama a POST /api/chat/conversation con los participantIds
   b. Obtiene el conversationId

4. Abre la ventana de chat:
   a. Emite 'unirse-conversacion' con el conversationId
   b. Llama a GET /api/chat/conversation/:id/messages para historial
   c. Escucha 'mensaje-privado-recibido' para nuevos mensajes

5. Envía un mensaje:
   - Opción A (recomendada): socket.emit('enviar-mensaje-privado', {...})
   - Opción B: POST /api/chat/private-message (también emite socket)

6. Cierra la ventana de chat:
   a. Emite 'salir-conversacion' con el conversationId
```

---

## Ejemplo completo en React

```jsx
import { useEffect, useState } from 'react'
import { io } from 'socket.io-client'

const socket = io('http://172.31.116.73:4000', { transports: ['websocket'] })

function ChatPrivado({ usuario, otroUsuarioId }) {
  const [conversacion, setConversacion] = useState(null)
  const [mensajes, setMensajes] = useState([])
  const [texto, setTexto] = useState('')

  // 1. Obtener o crear conversación
  useEffect(() => {
    fetch('/api/chat/conversation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ participantIds: [usuario._id, otroUsuarioId] })
    })
      .then(r => r.json())
      .then(data => setConversacion(data.data))
  }, [])

  // 2. Unirse a la sala + escuchar mensajes + cargar historial
  useEffect(() => {
    if (!conversacion?._id) return

    socket.emit('unirse-conversacion', conversacion._id)

    fetch(`/api/chat/conversation/${conversacion._id}/messages`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => setMensajes(data.data))

    socket.on('mensaje-privado-recibido', (msg) => {
      if (msg.conversationId === conversacion._id) {
        setMensajes(prev => [...prev, msg])
      }
    })

    return () => {
      socket.emit('salir-conversacion', conversacion._id)
      socket.off('mensaje-privado-recibido')
    }
  }, [conversacion])

  // 3. Enviar mensaje
  const enviar = () => {
    if (!texto.trim()) return
    socket.emit('enviar-mensaje-privado', {
      conversationId: conversacion._id,
      senderId: usuario._id,
      senderName: usuario.nombre,
      text: texto
    })
    setTexto('')
  }

  return (
    <div>
      {mensajes.map(m => (
        <div key={m._id}>
          <strong>{m.senderName}:</strong> {m.text}
        </div>
      ))}
      <input value={texto} onChange={e => setTexto(e.target.value)} />
      <button onClick={enviar}>Enviar</button>
    </div>
  )
}
```

---

## Eventos Socket.IO — Resumen

| Evento (frontend → backend) | Cuándo emitirlo | Payload |
|---|---|---|
| `usuario-conectado` | Al conectar socket y autenticarse | `{ _id, nombre, email, rol }` |
| `unirse-conversacion` | Al abrir ventana de chat | `conversationId` (string) |
| `salir-conversacion` | Al cerrar ventana de chat | `conversationId` (string) |
| `enviar-mensaje-privado` | Al enviar un mensaje | `{ conversationId, senderId, senderName, text }` |

| Evento (backend → frontend) | Cuándo escucharlo | Payload |
|---|---|---|
| `mensaje-privado-recibido` | Nuevo mensaje en la conversación activa | `{ _id, conversationId, senderId, senderName, text, timestamp }` |
| `usuario-conectado` | Un usuario se conectó | `{ socketId, userId, nombre, email, rol }` |
| `usuario-desconectado` | Un usuario se desconectó | `{ socketId, userId, nombre, email, rol }` |
| `usuarios-online` | Lista actualizada de usuarios conectados | `Array<{ socketId, userId, nombre, email, rol }>` |
