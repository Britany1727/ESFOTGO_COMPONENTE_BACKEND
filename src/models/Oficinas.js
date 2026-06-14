import { Schema, model } from "mongoose";

const oficinaSchema = new Schema({
    numero: {
        type: String,   
        required: true,
        trim: true
    },
    ubicacion: {
        type: String,
        required: true,
        trim: true
    },

    encargado: {
        type: String,
        trim: true
    },
    telefono: {
        type: String,
        trim: true
    },
    piso: {
        type: Number,
        default: 1
    },
    imagen: {
        type: String,
        trim: true
    },
    coordenadas: {
        lat: { type: Number },
        lng: { type: Number }
    },
    edificio: {
        type: Schema.Types.ObjectId,
        ref: 'Edificio',
        required: true

    }
}
,{
    timestamps: true,
    collection: 'oficinas'
})
export default model('Oficina', oficinaSchema)