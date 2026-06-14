import { Schema, model } from "mongoose"

const mensajeSchema = new Schema({
  text: {
    type: String,
    required: true,
    trim: true
  },
  from: {
    type: String,
    required: true,
    trim: true
  },
  room: {
    type: String,
    trim: true
  }
}, {
  timestamps: { createdAt: 'timestamp', updatedAt: false },
  collection: 'mensajes'
})

export default model('Mensaje', mensajeSchema)
