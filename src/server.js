import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import routerAdmins from './routers/Admin_routes.js';
import routerDocentes from './routers/Docente_routes.js';
import cloudinary from 'cloudinary'
import fileUpload from "express-fileupload"
import connection from './database.js'
import router from './routers/Estudiante_routes.js';
import routerMapa from './routers/Mapa_routes.js';
import routerAuth from './routers/Auth_routes.js';
import routerTutoria from './routers/Tutoria_routes.js';
import routerBus from './routers/Bus_routes.js';
import routerFavorito from './routers/Favorito_routes.js';
import routerChat from './routers/Chat_routes.js';

const app = express()

// Configuraciones Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})

// --- MIDDLEWARES (ORDEN CRÍTICO) ---
const CORS_ORIGINS = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',')
    : [
        "http://localhost:5173",
        "http://localhost:8081",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:8081",
        "http://172.31.116.73:5173",
        "http://172.31.116.73:8081",
    ];

app.use(cors({
    origin: CORS_ORIGINS,
    credentials: true
}))

app.use((req, res, next) => {
  req.url = req.url.replace(/\/+/g, '/')
  next()
})
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

app.use(fileUpload({
    useTempFiles : true,
    tempFileDir : process.env.VERCEL ? '/tmp' : './uploads'
}))

// Variables globales
app.set('port', process.env.PORT || 3000)

// --- RUTAS ---

app.get('/', (req, res) => res.send("Server on"))


app.use('/api', router)
app.use('/api', routerAdmins)
app.use('/api', routerDocentes)
app.use('/api', routerMapa)
app.use('/api', routerAuth)
app.use('/api', routerTutoria)
app.use('/api', routerBus)
app.use('/api', routerFavorito)
app.use('/api', routerChat)

// Servir frontend-test estático
app.use('/test', express.static('frontend-test'));

// Manejo de 404
app.use((req, res) => res.status(404).send("Endpoint no encontrado - 404"))

export default app;