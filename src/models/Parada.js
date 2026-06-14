import { Schema, model } from "mongoose"

const paradaSchema = new Schema({
  ruta_id: {
    type: Schema.Types.ObjectId,
    ref: 'Ruta',
    required: true
  },
  nombre: {
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
  orden: {
    type: Number,
    required: true
  }
}, {
  timestamps: true,
  collection: 'paradas'
})

paradaSchema.index({ ruta_id: 1, orden: 1 })

export default model('Parada', paradaSchema)
