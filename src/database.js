import mongoose from 'mongoose'
import dotenv from 'dotenv'

// Cargar variables de entorno
dotenv.config()

mongoose.set('strictQuery', true)

const connection = async()=>{
    try {
        
        if (!process.env.MONGODB_URI_PRODUCTION) {
            throw new Error('MONGODB_URI_PRODUCTION no está definida en .env');
        }
        
        const {connection} = await mongoose.connect(process.env.MONGODB_URI_PRODUCTION)
        console.log(`Database is connected on ${connection.host} - ${connection.port}`)
    } catch (error) {
        console.log('Error completo:', error);
    }
}

export default connection
