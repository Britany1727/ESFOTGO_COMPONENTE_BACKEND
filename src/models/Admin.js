import {Schema, model} from 'mongoose'
import bcrypt from 'bcryptjs'

const adminSchema = new Schema({
    nombre: {
        type: String,
        required: true,
        trim: true
    },
    apellido: {
        type: String,
        required: true,
        trim: true
    },
    telefono:{
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    status:{
        type:Boolean,   
        default:true
    },
    token:{ 
        type:String,
        default:null
    },
    rol:{
        type:String,
        default:"admin"
    }
},{
    timestamps:true,
    collection:"administradores"
})

// Método para encriptar la contraseña
adminSchema.methods.encryptPassword = async function(password){
    const salt = await bcrypt.genSalt(10)
    const passwordEncryp = await bcrypt.hash(password,salt)
    return passwordEncryp
}
// Método para comparar la contraseña ingresada con la contraseña encriptada
adminSchema.methods.matchPassword = async function(password){
    return await bcrypt.compare(password,this.password)
}
    
// Método para crear un token 
adminSchema.methods.createToken= function(){
    const tokenGenerado = Math.random().toString(36).slice(2)
    this.token = tokenGenerado
    return tokenGenerado
}

export default model('Admin', adminSchema)
    