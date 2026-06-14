import mongoose from 'mongoose'

mongoose.set('strictQuery', true)

const connection = async () => {
  try {
    if (!process.env.MONGODB_URI_PRODUCTION) {
      throw new Error('MONGODB_URI_PRODUCTION no está definida en .env');
    }

    const { connection } = await mongoose.connect(process.env.MONGODB_URI_PRODUCTION)
    console.log(`Database connected on ${connection.host} - ${connection.port}`)
  } catch (error) {
    console.error('Database connection error:', error.message)
    process.exit(1)
  }
}

export default connection
