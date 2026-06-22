# Chat General / Público — Flujo Frontend (Web)

## Endpoints REST

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/api/chat/messages?room=general` | No | Obtener hasta 200 mensajes del chat público |
| POST | `/api/chat/messages` | No | Enviar mensaje (alternativa REST) |

> Los mensajes públicos **no requieren autenticación**. Cualquier usuario puede leer y escribir.

---

## Socket.IO — Eventos en tiempo real

### 1. Identificar usuario en el chat

```js
socket.emit('usuario-conectado', {
  _id: usuario?._id || null,
  nombre: usuario?.nombre || 'Invitado',
  email: usuario?.email || '',
  rol: usuario?.rol || 'invitado'
})
```

### 2. Escuchar usuarios conectados

```js
// Al entrar un usuario
socket.on('usuario-conectado', (userInfo) => {
  // userInfo = { socketId, userId, nombre, email, rol }
})

// Al salir un usuario
socket.on('usuario-desconectado', (userInfo) => {
  // userInfo = { socketId, userId, nombre, email, rol }
})

// Lista completa actualizada
socket.on('usuarios-online', (lista) => {
  // lista = Array<{ socketId, userId, nombre, email, rol }>
  setUsuariosOnline(lista)
})
```

### 3. Enviar mensaje al chat público

```js
socket.emit('enviar-mensaje', {
  text: 'Hola a todos!',
  from: usuario?.nombre || 'Invitado',
  room: 'general' // opcional, por defecto 'general'
})
```

### 4. Recibir mensajes en tiempo real

```js
socket.on('mensaje-recibido', (mensaje) => {
  // mensaje = {
  //   _id: "msg_id",
  //   text: "Hola a todos!",
  //   from: "Juan Pérez",
  //   timestamp: "2026-06-21T12:00:00.000Z",
  //   room: "general"
  // }
  setMensajes(prev => [...prev, mensaje])
})
```

### 5. Cargar historial al entrar

```js
fetch('/api/chat/messages?room=general')
  .then(r => r.json())
  .then(data => setMensajes(data.data))
```

---

## Ejemplo completo en React

```jsx
import { useState, useEffect, useRef } from 'react'
import { io } from 'socket.io-client'

const socket = io('http://172.31.116.73:4000', { transports: ['websocket'] })

function ChatGeneral({ usuario }) {
  const [mensajes, setMensajes] = useState([])
  const [usuariosOnline, setUsuariosOnline] = useState([])
  const [texto, setTexto] = useState('')
  const [conectado, setConectado] = useState(socket.connected)
  const listaRef = useRef(null)

  // Conexión + identificación
  useEffect(() => {
    socket.on('connect', () => setConectado(true))
    socket.on('disconnect', () => setConectado(false))

    socket.emit('usuario-conectado', {
      _id: usuario?._id || null,
      nombre: usuario?.nombre || 'Invitado',
      email: usuario?.email || '',
      rol: usuario?.rol || 'invitado'
    })

    // Cargar historial
    fetch('/api/chat/messages?room=general')
      .then(r => r.json())
      .then(data => setMensajes(data.data || []))

    // Escuchar mensajes nuevos
    socket.on('mensaje-recibido', (msg) => {
      setMensajes(prev => [...prev, msg])
    })

    // Escuchar usuarios online
    socket.on('usuarios-online', setUsuariosOnline)

    return () => {
      socket.off('connect')
      socket.off('disconnect')
      socket.off('mensaje-recibido')
      socket.off('usuarios-online')
    }
  }, [])

  // Auto-scroll al final
  useEffect(() => {
    listaRef.current?.scrollTo({ top: listaRef.current.scrollHeight, behavior: 'smooth' })
  }, [mensajes])

  const enviar = (e) => {
    e.preventDefault()
    if (!texto.trim()) return

    socket.emit('enviar-mensaje', {
      text: texto.trim(),
      from: usuario?.nombre || 'Invitado',
      room: 'general'
    })
    setTexto('')
  }

  return (
    <div style={styles.container}>
      {/* Header con conectados */}
      <div style={styles.header}>
        <h3>Chat General</h3>
        <span style={styles.online}>
          {conectado ? '🟢' : '🔴'} {usuariosOnline.length} conectados
        </span>
      </div>

      {/* Lista de usuarios online */}
      <div style={styles.usuarios}>
        {usuariosOnline.map((u, i) => (
          <span key={i} style={styles.chip}>{u.nombre}</span>
        ))}
      </div>

      {/* Mensajes */}
      <div ref={listaRef} style={styles.lista}>
        {mensajes.map(m => (
          <div key={m._id} style={styles.mensaje}>
            <strong style={styles.from}>{m.from}:</strong>
            <span>{m.text}</span>
            <small style={styles.hora}>
              {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </small>
          </div>
        ))}
      </div>

      {/* Input */}
      <form onSubmit={enviar} style={styles.form}>
        <input
          style={styles.input}
          value={texto}
          onChange={e => setTexto(e.target.value)}
          placeholder="Escribe un mensaje..."
        />
        <button style={styles.boton} type="submit">Enviar</button>
      </form>
    </div>
  )
}

const styles = {
  container: { display: 'flex', flexDirection: 'column', height: '100vh', maxWidth: 600, margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 10, borderBottom: '1px solid #ddd' },
  online: { fontSize: 14, color: '#666' },
  usuarios: { display: 'flex', gap: 6, padding: '6px 10px', overflowX: 'auto', borderBottom: '1px solid #eee' },
  chip: { background: '#e0e0e0', borderRadius: 12, padding: '2px 10px', fontSize: 12, whiteSpace: 'nowrap' },
  lista: { flex: 1, overflowY: 'auto', padding: 10, display: 'flex', flexDirection: 'column', gap: 8 },
  mensaje: { background: '#f5f5f5', padding: '6px 10px', borderRadius: 8 },
  from: { marginRight: 6 },
  hora: { marginLeft: 8, color: '#999', fontSize: 11 },
  form: { display: 'flex', padding: 10, borderTop: '1px solid #ddd', gap: 8 },
  input: { flex: 1, padding: 10, borderRadius: 20, border: '1px solid #ddd' },
  boton: { padding: '10px 20px', borderRadius: 20, border: 'none', background: '#075E54', color: '#fff', cursor: 'pointer' }
}
```

---

## Eventos Socket.IO — Chat público

| Evento | Dirección | Payload |
|---|---|---|
| `usuario-conectado` | App → Servidor | `{ _id, nombre, email, rol }` |
| `enviar-mensaje` | App → Servidor | `{ text, from, room }` |
| `mensaje-recibido` | Servidor → App | `{ _id, text, from, timestamp, room }` |
| `usuarios-online` | Servidor → App | `Array<{ socketId, userId, nombre, email, rol }>` |
| `usuario-conectado` | Servidor → App | `{ socketId, userId, nombre, email, rol }` |
| `usuario-desconectado` | Servidor → App | `{ socketId, userId, nombre, email, rol }` |
