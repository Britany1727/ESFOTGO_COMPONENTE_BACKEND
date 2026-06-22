import { v2 as cloudinary } from 'cloudinary'
import fs from "fs-extra"


// Subir archivos a Cloudinary
const subirImagenCloudinary = async (filePath, folder) => {
    const { secure_url, public_id } = await cloudinary.uploader.upload(filePath, { folder })
    await fs.unlink(filePath)
    return { secure_url, public_id }
}

// Subir Base64 a Cloudinary
const subirBase64Cloudinary = async (base64, folder) => {
    const buffer = Buffer.from(base64.replace(/^data:image\/\w+;base64,/, ''), 'base64')
    
    const { secure_url } = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream({ folder, resource_type: 'auto' }, (err, res) => {
            if (err) reject(err);
            else resolve(res);
        })
        stream.end(buffer)
    })
    return secure_url
}

//Subir imagenes de Eventos
const subirImagenDocente = async (filePath) => {
    return await subirImagenCloudinary(filePath, "Docentes")
}   

const subirBase64Docente = async (base64) => {
    return await subirBase64Cloudinary(base64, "Docentes")
}
//Subir imagenes de Eventos
const subirImagenEstudiante = async (filePath) => {
    return await subirImagenCloudinary(filePath, "Estudiantes")
}   

const subirBase64Estudiante = async (base64) => {
    return await subirBase64Cloudinary(base64, "Estudiantes")
}

//Subir imagenes de Eventos
const subirImagenAdmin = async (filePath) => {
    return await subirImagenCloudinary(filePath, "Administradores")
}   

const subirBase64Admin = async (base64) => {
    return await subirBase64Cloudinary(base64, "Administradores")
}
// Subir imágenes de oficinas
const subirImagenOficina = async (filePath) => {
    return await subirImagenCloudinary(filePath, "Oficinas")
}

const subirBase64Oficina = async (base64) => {
    return await subirBase64Cloudinary(base64, "Oficinas")
}

// Subir imágenes de aulas
const subirImagenAula = async (filePath) => {
    return await subirImagenCloudinary(filePath, "Aulas")
}

const subirBase64Aula = async (base64) => {
    return await subirBase64Cloudinary(base64, "Aulas")
}

//Subir imagenes de Eventos
const subirImagenEvento = async (filePath) => {
    return await subirImagenCloudinary(filePath, "Eventos")
}   

const subirBase64Evento = async (base64) => {
    return await subirBase64Cloudinary(base64, "Eventos")
}



export {
    subirImagenCloudinary,
    subirBase64Cloudinary,
    subirImagenOficina,
    subirBase64Oficina,
    subirImagenAula,
    subirBase64Aula,
    subirImagenEvento,
    subirBase64Evento,
    subirImagenAdmin,
    subirBase64Admin,
    subirImagenDocente,
    subirBase64Docente,
    subirImagenEstudiante,
    subirBase64Estudiante
}