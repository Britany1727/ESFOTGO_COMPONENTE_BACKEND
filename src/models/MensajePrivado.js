import { Schema, model } from "mongoose"

const mensajePrivadoSchema = new Schema({
  conversationId: {
    type: String,
    required: true
  },
  senderId: {
    type: String,
    required: true
  },
  senderName: {
    type: String,
    required: true,
    trim: true
  },
  text: {
    type: String,
    required: true,
    trim: true
  }
}, {
  timestamps: { createdAt: 'timestamp', updatedAt: false },
  collection: 'mensajes_privados'
})

mensajePrivadoSchema.index({ conversationId: 1, timestamp: -1 })

export default model('MensajePrivado', mensajePrivadoSchema)
