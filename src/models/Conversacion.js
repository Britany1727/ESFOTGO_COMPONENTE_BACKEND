import { Schema, model } from "mongoose"

const conversacionSchema = new Schema({
  participantIds: [{
    type: String,
    required: true
  }],
  lastMessage: {
    type: String,
    default: null
  },
  lastMessageAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  collection: 'conversaciones'
})

export default model('Conversacion', conversacionSchema)
