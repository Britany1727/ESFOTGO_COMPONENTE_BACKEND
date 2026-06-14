import { Schema, model } from "mongoose"

const posicionSchema = new Schema({
  ruta_id: {
    type: Schema.Types.ObjectId,
    ref: 'Ruta',
    required: true
  },
  bus_id: {
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
  heading: {
    type: Number,
    default: 0
  }
}, {
  timestamps: { updatedAt: 'updated_at', createdAt: false },
  collection: 'posiciones'
})

posicionSchema.index({ ruta_id: 1, bus_id: 1 })

export default model('Posicion', posicionSchema)
