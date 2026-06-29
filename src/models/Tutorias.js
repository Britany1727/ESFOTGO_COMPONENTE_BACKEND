import { Schema, model } from "mongoose"

const tutoriaSchema = new Schema({
  titulo: {
    type: String,
    trim: true
  },
  docente: {
    type: Schema.Types.ObjectId,
    ref: 'Docente',
    required: true
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
  fecha: {
    type: Date
  },
  duracion: {
    type: Number
  },
  cupo_maximo: {
    type: Number
  },
  creado_por: {
    type: String,
    trim: true
  },
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
