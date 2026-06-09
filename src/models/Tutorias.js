import { Schema, model } from "mongoose"

const tutoriaSchema = new Schema({
    docente:{
        type:Schema.Types.ObjectId,
        ref:"Docente",
        required:true
    },
    fecha:{
        type:Date,
        required:true
    },
    horaInicio:{
        type:String,
        required:true
    },
    horaFin:{
        type:String,
        required:true
    },
    lugar:{
        type:String,
        required:true
    },
    materia:{
        type:String,
        required:true
    },
    descripcion:{
        type:String,
        required:true
    },
},{
    timestamps:true,
    collection: 'tutorias'
})

export default model('Tutoria',tutoriaSchema)