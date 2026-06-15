import mongoose from 'mongoose'

mongoose.set('strictQuery', true)

let isConnected = false

const connection = async () => {
  if (isConnected) return

  try {
    if (!process.env.MONGODB_URI_PRODUCTION) {
      throw new Error('MONGODB_URI_PRODUCTION no está definida en .env');
    }

    await mongoose.connect(process.env.MONGODB_URI_PRODUCTION)
    isConnected = true
    console.log(`Database connected on ${mongoose.connection.host} - ${mongoose.connection.port}`)
  } catch (error) {
    console.error('Database connection error:', error.message)
    if (!process.env.VERCEL) process.exit(1)
    throw error
  }
}

export default connection
