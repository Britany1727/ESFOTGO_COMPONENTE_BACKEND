import { Schema, model } from "mongoose";

const conexionSchema = new Schema({
    nodoOrigen: {
        type: Schema.Types.ObjectId,
        ref: 'Nodo',
        required: true
    },
    nodoDestino: {
        type: Schema.Types.ObjectId,
        ref: 'Nodo',
        required: true
    },
    distancia: {
        type: Number,
        required: true
    },
    unidireccional: {
        type: Boolean,
        default: false
    },
    tipo: {
        type: String,
        enum: ['pasillo', 'escalera', 'ascensor', 'rampa', 'exterior'],
        default: 'pasillo'
    },
    activo: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true,
    collection: 'conexiones'
});

conexionSchema.index({ nodoOrigen: 1, nodoDestino: 1 });

export default model('Conexion', conexionSchema);
