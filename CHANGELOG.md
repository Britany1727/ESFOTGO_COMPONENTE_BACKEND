# Registro de Cambios

## 1. Modelos

### `src/models/Edificio.js`
- **ELIMINADO** - Archivo completo eliminado

### `src/models/Aulas.js`
- Eliminado campo `edificio: { type: Schema.Types.ObjectId, ref: 'Edificio', required: true }`
- Eliminado índice `aulaSchema.index({ edificio: 1, numero: 1 })`

### `src/models/Nodo.js`
- Eliminado campo `edificioId: { type: Schema.Types.ObjectId, ref: 'Edificio', required: true }`
- Eliminado índice `nodoSchema.index({ edificioId: 1, piso: 1 })`

### `src/models/Oficinas.js`
- Eliminado campo `edificio: { type: Schema.Types.ObjectId, ref: 'Edificio', required: true }`

### `src/models/Favorito.js`
- Eliminado `'edificio'` del enum `item_tipo` (quedó: `['aula', 'ruta', 'ubicacion']`)

## 2. Helpers

### `src/helpers/uploadCloudinary.js`
- Eliminadas funciones `subirImagenEdificio` y `subirBase64Edificio`
- Eliminadas exportaciones correspondientes

## 3. Controladores

### `src/controllers/mapa_controllers.js`
- Eliminado import de `Edificio`
- Eliminada función `obtenerAreaEsfot`
- Eliminadas funciones CRUD: `crearEdificio`, `listarEdificios`, `verEdificio`, `actualizarEdificio`, `eliminarEdificio`
- Eliminado `.populate('edificio', 'nombre codigo')` en `obtenerPuntosMapa` y `buscarDestino`
- Eliminado campo `edificio` del mapeo de aulas y oficinas en `obtenerPuntosMapa` y `buscarDestino`
- Eliminado filtro `edificioId` en `obtenerNodosNavegacion` y `listarNodos360`
- Eliminado parámetro `edificioId` en `obtenerGrafo`
- Eliminado `.populate('edificioId', 'nombre codigo')` en `obtenerNodosNavegacion`, `obtenerVista360` y `listarNodos360`
- Eliminado campo `edificioId` de `crearNodo` (destructuring y creación)
- Eliminado campo `edificioId` de respuesta en `obtenerVista360`
- Actualizado export

### `src/controllers/admin_controllers.js`
- Eliminado campo `edificio` de validación y creación en `crearOficinas`
- Eliminado campo `edificio` de actualización en `actualizarOficina`
- Eliminado campo `edificio` de validación y creación en `crearAulas`
- Eliminado campo `edificio` de actualización en `actualizarAula`
- Eliminado `.populate('edificio', 'nombre codigo')` en `listarAulas` y `verAula`

### `src/controllers/grafo_controllers.js`
- Eliminado filtro por `edificioId` en `listarAristas`

## 4. Servicios

### `src/services/routing.service.js`
- Eliminada función `obtenerNodosPorEdificio`
- Simplificada `obtenerGrafoCompleto` (eliminado parámetro `edificioId` y lógica de filtrado)
- Eliminado campo `edificioId` del mapeo de nodos

## 5. Rutas

### `src/routers/Mapa_routes.js`
- Eliminada importación de funciones de edificio
- Eliminada ruta `/mapa/area`
- Eliminadas rutas CRUD de edificio (`/admin/mapa/edificio`, `/admin/mapa/edificios`, `/admin/mapa/edificio/:id`)

### `src/routers/Admin_routes.js`
- Eliminada importación de funciones de edificio
- Eliminadas rutas CRUD de edificio (`/admin/edificio`, `/admin/edificios`, `/admin/edificio/:id`)
- Eliminadas rutas duplicadas de mapa edificio (`/admin/mapa/edificio`, etc.)

---

## 6. Cambios anteriores

### Password null para Docente y Estudiante
- **`src/models/Docente.js`**: `password` cambiado de `required: true` a `default: null`
- **`src/models/Estudiante.js`**: `password` cambiado de `required: true` a `default: null`
- **`src/services/excel.service.js`**: Eliminado `bcrypt.hash` de cadena vacía, ahora asigna `password: null`
- **`src/services/excel.service.js`**: Eliminado import de `bcrypt`

---

## 7. Chat en tiempo real para mensajes privados

### `src/helpers/socket.js` (NUEVO)
- Centralizada toda la lógica de Socket.IO
- Se añadió `userId` al tracking de usuarios conectados
- Nuevos eventos para chat privado:
  - `unirse-conversacion` — el cliente se une a una sala `conv-<id>`
  - `salir-conversacion` — el cliente abandona la sala
  - `enviar-mensaje-privado` — recibe el mensaje por socket, lo guarda en MongoDB y emite `mensaje-privado-recibido` a la sala
- Exporta `initSocket(server)` y `getIO()`

### `src/index.js`
- Simplificado: ya no configura Socket.IO directamente, solo llama a `initSocket(server)`

### `src/controllers/private_chat_controllers.js`
- Importa `getIO` desde `helpers/socket.js`
- En `sendPrivateMessage`, después de guardar en DB, emite `mensaje-privado-recibido` a la sala `conv-<id>` para notificar en tiempo real a los participantes

---

## 8. Fix registro estudiante/docente con password null

### `src/controllers/estudiante_controllers.js`
- Reemplazado `bcrypt.compare('', estudianteBDD.password)` por `estudianteBDD.password !== null` — bcrypt fallaba con `"Illegal arguments: string, object"` porque ahora el password es `null` (desde carga masiva)
- Eliminado import de `bcrypt` (ya no se usa)

### `src/controllers/docente_controllers.js`
- Mismo fix: `bcrypt.compare('', docenteBDD.password)` → `docenteBDD.password !== null`
- Eliminado import de `bcrypt`

---

## 8. Campos imagen_360 y tipo_media en Ubicacion + CORS

### `src/models/Ubicacion.js`
- Agregado campo `imagen_360` (String, trim, default: null)
- Agregado campo `tipo_media` (String, trim, default: null)

### `src/controllers/ubicacion_controllers.js`
- `crearUbicacion`: ahora acepta `imagen_360`/`image360` y `tipo_media`/`mediaType`
- `imagen_360` se sube a Cloudinary si viene como base64
- `actualizarUbicacion`: ahora actualiza `imagen_360` y `tipo_media` condicionalmente
- Soporta dual snake_case / camelCase para compatibilidad con frontend

### `src/server.js`
- CORS actualizado: agregados orígenes `localhost:8081`, `127.0.0.1:8081` para Expo
- Ahora soporta variable de entorno `CORS_ORIGINS` (lista separada por comas)
