# Chat Privado — Flujo Mobile (React Native)

## Diferencia con web

React Native no tiene `socket.io-client` por defecto. Se usa `socket.io-client` igual que en web, pero la conexión debe configurarse con `transports: ['websocket']` para evitar problemas con polling y CORS.

---

## Instalación

```bash
npm install socket.io-client
# o
yarn add socket.io-client
```

---

## Endpoints REST (mismos que web)

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| POST | `/api/chat/conversation` | JWT | Obtener o crear conversación |
| GET | `/api/chat/conversations` | JWT | Listar conversaciones del usuario |
| GET | `/api/chat/conversation/:id/messages` | JWT | Historial de mensajes |
| POST | `/api/chat/private-message` | JWT | Enviar mensaje (alternativa REST) |

---

## Socket.IO — Conexión y eventos

### Crear el socket (singleton)

```ts
// services/socket.ts
import { io, Socket } from 'socket.io-client'

const SOCKET_URL = 'http://172.31.116.73:4000'

let socket: Socket | null = null

export const conectarSocket = (token?: string) => {
  if (socket?.connected) return socket

  socket = io(SOCKET_URL, {
    transports: ['websocket'], // Obligatorio en React Native
    autoConnect: true,
    ...(token ? { auth: { token } } : {})
  })

  socket.on('connect', () => {
    console.log('Socket conectado:', socket?.id)
  })

  socket.on('disconnect', (reason) => {
    console.log('Socket desconectado:', reason)
  })

  socket.on('connect_error', (err) => {
    console.log('Error de conexión socket:', err.message)
  })

  return socket
}

export const getSocket = (): Socket => {
  if (!socket) throw new Error('Socket no conectado')
  return socket
}

export const desconectarSocket = () => {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}
```

### Hook useChatPrivado

```ts
// hooks/useChatPrivado.ts
import { useState, useEffect, useCallback, useRef } from 'react'
import { getSocket, conectarSocket } from '../services/socket'

interface Mensaje {
  _id: string
  conversationId: string
  senderId: string
  senderName: string
  text: string
  timestamp: string
}

interface Conversacion {
  _id: string
  participantIds: string[]
  participantNames: Record<string, string>
  lastMessage: string | null
  lastMessageAt: string | null
}

const API = 'http://172.31.116.73:4000/api'

export const useChatPrivado = (usuario: { _id: string; nombre: string; email: string; rol: string }, token: string) => {
  const [conversaciones, setConversaciones] = useState<Conversacion[]>([])
  const [mensajes, setMensajes] = useState<Mensaje[]>([])
  const [conversacionActiva, setConversacionActiva] = useState<string | null>(null)
  const socketRef = useRef(getSocket())

  useEffect(() => {
    const socket = conectarSocket()
    socketRef.current = socket

    socket.emit('usuario-conectado', {
      _id: usuario._id,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol
    })
  }, [])

  // Escuchar mensajes nuevos
  useEffect(() => {
    const socket = socketRef.current
    const handler = (msg: Mensaje) => {
      if (msg.conversationId === conversacionActiva) {
        setMensajes(prev => [...prev, msg])
      }
      // Actualizar última conversación en la lista
      setConversaciones(prev =>
        prev.map(c =>
          c._id === msg.conversationId
            ? { ...c, lastMessage: msg.text, lastMessageAt: msg.timestamp }
            : c
        )
      )
    }

    socket.on('mensaje-privado-recibido', handler)
    return () => { socket.off('mensaje-privado-recibido', handler) }
  }, [conversacionActiva])

  // 1. Obtener o crear conversación
  const obtenerOCrearConversacion = useCallback(async (otroUsuarioId: string): Promise<Conversacion> => {
    const res = await fetch(`${API}/chat/conversation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ participantIds: [usuario._id, otroUsuarioId] })
    })
    const json = await res.json()
    return json.data
  }, [])

  // 2. Listar conversaciones del usuario
  const listarConversaciones = useCallback(async () => {
    const res = await fetch(`${API}/chat/conversations`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const json = await res.json()
    setConversaciones(json.data)
  }, [])

  // 3. Abrir una conversación (unirse a sala + cargar historial)
  const abrirConversacion = useCallback(async (conversationId: string) => {
    const socket = socketRef.current

    // Salir de la anterior
    if (conversacionActiva) {
      socket.emit('salir-conversacion', conversacionActiva)
    }

    // Unirse a la nueva
    socket.emit('unirse-conversacion', conversationId)
    setConversacionActiva(conversationId)

    // Cargar historial
    const res = await fetch(`${API}/chat/conversation/${conversationId}/messages`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const json = await res.json()
    setMensajes(json.data)
  }, [conversacionActiva])

  // 4. Enviar mensaje (por socket)
  const enviarMensaje = useCallback((text: string) => {
    if (!conversacionActiva || !text.trim()) return

    socketRef.current.emit('enviar-mensaje-privado', {
      conversationId: conversacionActiva,
      senderId: usuario._id,
      senderName: usuario.nombre,
      text: text.trim()
    })
  }, [conversacionActiva])

  // 5. Cerrar conversación activa
  const cerrarConversacion = useCallback(() => {
    if (conversacionActiva) {
      socketRef.current.emit('salir-conversacion', conversacionActiva)
      setConversacionActiva(null)
      setMensajes([])
    }
  }, [conversacionActiva])

  return {
    conversaciones,
    mensajes,
    conversacionActiva,
    obtenerOCrearConversacion,
    listarConversaciones,
    abrirConversacion,
    enviarMensaje,
    cerrarConversacion
  }
}
```

### Pantalla de chat

```tsx
// screens/ChatPrivadoScreen.tsx
import React, { useEffect, useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  FlatList, StyleSheet, SafeAreaView
} from 'react-native'
import { useChatPrivado } from '../hooks/useChatPrivado'

interface Props {
  usuario: { _id: string; nombre: string; email: string; rol: string }
  token: string
  otroUsuarioId: string
}

export const ChatPrivadoScreen: React.FC<Props> = ({ usuario, token, otroUsuarioId }) => {
  const [input, setInput] = useState('')
  const {
    mensajes, enviarMensaje, abrirConversacion,
    cerrarConversacion, obtenerOCrearConversacion
  } = useChatPrivado(usuario, token)

  useEffect(() => {
    obtenerOCrearConversacion(otroUsuarioId)
      .then(conv => abrirConversacion(conv._id))
    return () => cerrarConversacion()
  }, [])

  const handleEnviar = () => {
    enviarMensaje(input)
    setInput('')
  }

  const renderMensaje = ({ item }: { item: typeof mensajes[0] }) => {
    const esMio = item.senderId === usuario._id
    return (
      <View style={[styles.burbuja, esMio ? styles.mio : styles.otro]}>
        {!esMio && <Text style={styles.nombre}>{item.senderName}</Text>}
        <Text style={styles.texto}>{item.text}</Text>
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={mensajes}
        renderItem={renderMensaje}
        keyExtractor={item => item._id}
        style={styles.lista}
        inverted={false}
      />
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Escribe un mensaje..."
        />
        <TouchableOpacity style={styles.boton} onPress={handleEnviar}>
          <Text style={styles.botonTexto}>Enviar</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  lista: { flex: 1, paddingHorizontal: 10 },
  burbuja: { padding: 10, borderRadius: 10, marginVertical: 4, maxWidth: '80%' },
  mio: { backgroundColor: '#DCF8C6', alignSelf: 'flex-end' },
  otro: { backgroundColor: '#ECECEC', alignSelf: 'flex-start' },
  nombre: { fontWeight: 'bold', fontSize: 12, marginBottom: 2, color: '#555' },
  texto: { fontSize: 16 },
  inputContainer: { flexDirection: 'row', padding: 10, borderTopWidth: 1, borderColor: '#ddd' },
  input: { flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 20, paddingHorizontal: 15, marginRight: 10 },
  boton: { backgroundColor: '#075E54', borderRadius: 20, paddingHorizontal: 20, justifyContent: 'center' },
  botonTexto: { color: '#fff', fontWeight: 'bold' }
})
```

### Lista de conversaciones

```tsx
// screens/ConversacionesScreen.tsx
import React, { useEffect } from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native'
import { useChatPrivado } from '../hooks/useChatPrivado'

export const ConversacionesScreen = ({ usuario, token, navigation }) => {
  const { conversaciones, listarConversaciones } = useChatPrivado(usuario, token)

  useEffect(() => {
    listarConversaciones()
  }, [])

  const obtenerNombreOtro = (conv: typeof conversaciones[0]) => {
    const otroId = conv.participantIds.find(id => id !== usuario._id)
    return conv.participantNames[otroId || ''] || 'Usuario'
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={conversaciones}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.item}
            onPress={() => navigation.navigate('Chat', { conversationId: item._id })}
          >
            <Text style={styles.nombre}>{obtenerNombreOtro(item)}</Text>
            {item.lastMessage && (
              <Text style={styles.ultimo}>{item.lastMessage}</Text>
            )}
          </TouchableOpacity>
        )}
        keyExtractor={item => item._id}
      />
    </View>
  )
}
```

---

## Consideraciones para React Native

| Aspecto | Recomendación |
|---|---|
| Transporte | Usar **solo websocket**: `transports: ['websocket']` |
| Reconexión | Socket.IO reconecta automáticamente, pero manejar en `connect_error` |
| Token | Pasar token en `auth` al conectar o en headers REST |
| Memoria | Limpiar listeners en `useEffect` return para evitar fugas |
| FlatList | Usar `inverted={false}` con `scrollToEnd` para mensajes nuevos |
| Permisos | No necesita permisos especiales (no es cámara ni GPS) |

---

## Resumen de eventos Socket.IO (mobile)

| Evento | Dirección | Cuándo |
|---|---|---|
| `usuario-conectado` | App → Servidor | Al conectar el socket |
| `unirse-conversacion` | App → Servidor | Al abrir un chat |
| `salir-conversacion` | App → Servidor | Al cerrar un chat |
| `enviar-mensaje-privado` | App → Servidor | Al enviar mensaje |
| `mensaje-privado-recibido` | Servidor → App | Nuevo mensaje en tiempo real |
