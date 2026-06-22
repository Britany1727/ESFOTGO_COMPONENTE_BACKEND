import { Schema, model } from "mongoose"

const favoritoSchema = new Schema({
  usuario_id: {
    type: String,
    required: true
  },
  usuario_tipo: {
    type: String,
    enum: ['estudiante', 'docente', 'admin'],
    required: true
  },
  item_id: {
    type: String,
    required: true
  },
  item_tipo: {
    type: String,
    enum: ['aula', 'ruta', 'ubicacion'],
    required: true
  },
  item_nombre: {
    type: String,
    required: true,
    trim: true
  },
  item_data: {
    type: Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: false },
  collection: 'favoritos'
})

favoritoSchema.index({ usuario_id: 1, item_id: 1, item_tipo: 1 }, { unique: true })

export default model('Favorito', favoritoSchema)
