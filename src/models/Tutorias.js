import { Schema, model } from "mongoose"

const tutoriaSchema = new Schema({
  docente: {
    type: String,
    required: true,
    trim: true
  },
  oficina: {
    type: String,
    required: true,
    trim: true
  },
  informacion: {
    type: String,
    required: true,
    trim: true
  },
  horarios: [
    {
      dia: {
        type: String,
        required: true,
        trim: true
      },
      horaInicio: {
        type: String,
        required: true,
        trim: true
      },
      horaFin: {
        type: String,
        required: true,
        trim: true
      }
    }
  ],
  estado: {
    type: String,
    enum: ['activo', 'inactivo', 'completo'],
    default: 'activo'
  }
}, {
  timestamps: true,
  collection: 'tutorias'
})

export default model('Tutoria', tutoriaSchema)
