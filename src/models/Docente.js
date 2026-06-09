import {Schema, model} from 'mongoose'
import bcrypt from "bcryptjs"

const docenteSchema = new Schema({
    nombre:{
        type:String,
        trim:true
    },
    apellido:{
        type:String,
        trim:true
    },
    telefono:{
        type:String,
        required:true,
        trim:true
    },
    email:{
        type:String,
        required:true,
        trim:true,
		unique:true
    },
    password:{
        type:String,
        required:true
    },
    Oficina:{
        type:Schema.Types.ObjectId,
        ref:"Oficina",
        default:null
    },
    Imagen:{
        type:Schema.Types.ObjectId,
        ref:"Imagen",
        default:null
    },
    status:{
        type:Boolean,
        default:true
    },
    token:{
        type:String,
        default:null
    },
    confirmEmail:{
        type:Boolean,
        default:false
    },
    rol:{
        type:String,
        default:"docente"
    }

},{
    timestamps:true,
    collection: 'docentes'
})

// Método para cifrar el password
docenteSchema.methods.encryptPassword = async function(password){
    const salt = await bcrypt.genSalt(10)
    const passwordEncryp = await bcrypt.hash(password,salt)
    return passwordEncryp
}


// Método para verificar si el password es el mismo de la BDD
docenteSchema.methods.matchPassword = async function(password){
    const response = await bcrypt.compare(password,this.password)
    return response
}


// Método para crear un token 
docenteSchema.methods.createToken= function(){
    const tokenGenerado = Math.random().toString(36).slice(2)
    this.token = tokenGenerado
    return tokenGenerado
}


export default model('Docente',docenteSchema)