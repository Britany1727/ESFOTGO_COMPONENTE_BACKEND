import { Schema, model } from "mongoose"

const refreshTokenSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    required: true,
    refPath: 'userType'
  },
  userType: {
    type: String,
    required: true,
    enum: ['Admin', 'Docente', 'Estudiante']
  },
  token: {
    type: String,
    required: true,
    unique: true
  },
  expires_at: {
    type: Date,
    required: true
  }
}, {
  timestamps: true,
  collection: 'refresh_tokens'
})

refreshTokenSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 })
refreshTokenSchema.index({ userId: 1 })

export default model('RefreshToken', refreshTokenSchema)
