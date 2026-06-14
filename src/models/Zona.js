import { Schema, model } from "mongoose"

const zonaSchema = new Schema({
  nombre: {
    type: String,
    required: true,
    trim: true
  },
  descripcion: {
    type: String,
    trim: true
  },
  coordenadas: [
    {
      latitude: {
        type: Number,
        required: true
      },
      longitude: {
        type: Number,
        required: true
      }
    }
  ],
  fill_color: {
    type: String,
    trim: true
  },
  stroke_color: {
    type: String,
    trim: true
  },
  activo: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  collection: 'zonas'
})

export default model('Zona', zonaSchema)
