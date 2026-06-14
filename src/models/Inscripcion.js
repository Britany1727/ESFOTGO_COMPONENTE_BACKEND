import { Schema, model } from "mongoose"

const inscripcionSchema = new Schema({
  tutoria_id: {
    type: Schema.Types.ObjectId,
    ref: 'Tutoria',
    required: true
  },
  estudiante_id: {
    type: Schema.Types.ObjectId,
    ref: 'Estudiante',
    required: true
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: false },
  collection: 'inscripciones'
})

inscripcionSchema.index({ tutoria_id: 1, estudiante_id: 1 }, { unique: true })

export default model('Inscripcion', inscripcionSchema)
