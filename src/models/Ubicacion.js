import { Schema, model } from "mongoose"

const ubicacionSchema = new Schema({
  nombre: {
    type: String,
    required: true,
    trim: true
  },
  descripcion: {
    type: String,
    trim: true
  },
  categoria: {
    type: String,
    required: true,
    trim: true
  },
  latitud: {
    type: Number,
    required: true
  },
  longitud: {
    type: Number,
    required: true
  },
  imagen: {
    type: String,
    trim: true
  },
  imagen_360: {
    type: String,
    trim: true,
    default: null
  },
  tipo_media: {
    type: String,
    trim: true,
    default: null
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: false },
  collection: 'ubicaciones'
})

export default model('Ubicacion', ubicacionSchema)
