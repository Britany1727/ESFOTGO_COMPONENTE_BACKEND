import { Schema, model } from "mongoose";

const edificioSchema = new Schema({
    nombre: {
        type: String,
        required: true,
        trim: true
    },
    codigo: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    descripcion: {
        type: String,
        trim: true
    },
    centro: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number],
            required: true
        }
    },
    poligono: {
        type: {
            type: String,
            enum: ['Polygon'],
            default: 'Polygon'
        },
        coordinates: {
            type: [[[Number]]],
            required: true
        }
    },
    pisos: {
        type: Number,
        default: 1
    },
    imagen: {
        type: String,
        trim: true
    }
}, {
    timestamps: true,
    collection: 'edificios'
});

edificioSchema.index({ centro: '2dsphere' });

export default model('Edificio', edificioSchema);
