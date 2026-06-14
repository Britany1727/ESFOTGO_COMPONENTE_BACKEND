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
    edificio: {
        type: Schema.Types.ObjectId,
        ref: 'Edificio',
        required: true
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

aulaSchema.index({ edificio: 1, numero: 1 })

export default model('Aula', aulaSchema)