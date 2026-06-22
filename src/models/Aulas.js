import { Schema, model } from "mongoose"

const aulaSchema = new Schema({
    numero: {
        type: String,
        required: true,
        trim: true
    },
    nombre: {
        type: String,
        trim: true
    },
    ubicacion: {
        type: String,
        required: true,
        trim: true
    },
    tipo: {
        type: String,
        required: true,
        enum: ['aula', 'laboratorio'],
        trim: true
    },
    estado: {
        type: String,
        enum: ['disponible', 'ocupado', 'mantenimiento'],
        default: 'disponible'
    },
    imagen: {
        type: String,
        trim: true
    },
    piso: {
        type: Number,
        default: 1
    },
    coordenadas: {
        lat: { type: Number },
        lng: { type: Number }
    }
}, {
    timestamps: true,
    collection: 'aulas'
})

export default model('Aula', aulaSchema)