import Docente from "../models/Docente.js"
import { sendMailToRecoveryPassword } from "../helpers/sendMail.js"
import { crearTokenJWT } from "../middlewares/JWT.js"
import mongoose from "mongoose"
import Evento from "../models/Evento.js"
import Oficina from "../models/Oficinas.js"
import Aula from "../models/Aulas.js"
import { subirImagenCloudinary } from "../helpers/uploadCloudinary.js"



const registroDocente = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ msg: "Lo sentimos, debes llenar todos los campos" });
        }

        // Buscar docente pre-registrado en la carga masiva
        const docenteBDD = await Docente.findOne({ email });

        // ❌ No está en la BDD = no autorizado
        if (!docenteBDD) {
            return res.status(403).json({ 
                msg: "Lo sentimos, tu correo no está autorizado. Contacta al administrador." 
            });
        }

        // ❌ Ya completó su registro
        if (docenteBDD.password != null || docenteBDD.password != "") {
            return res.status(400).json({ msg: "Esta cuenta ya se encuentra activa" });
        }

        // ✅ Solo actualizar password e imagen sobre el doc existente
        docenteBDD.password = await docenteBDD.encryptPassword(password);

        if (req.files?.subirImagenDocente) {
            const { secure_url } = await subirImagenDocente(req.files.subirImagenDocente.tempFilePath);
            docenteBDD.imagen = secure_url;
        }

        if (req.body.subirBase64Docente) {
            const secure_url = await subirBase64Docente(req.body.subirBase64Docente);
            docenteBDD.imagen = secure_url;
        }

        await docenteBDD.save();
        res.status(200).json({ msg: "Registrado exitosamente" });

    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: `❌ Error en el servidor - ${error.message}` });
    }
}

const recuperarPasswordDocente = async (req, res) => {

    try {
        const { email } = req.body
        if (!email) return res.status(400).json({ msg: "Debes ingresar un correo electrónico" })
        const docenteBDD = await Docente.findOne({ email })
        if (!docenteBDD) return res.status(404).json({ msg: "El usuario no se encuentra registrado" })
        const token = docenteBDD.createToken()
        docenteBDD.token = token
        await sendMailToRecoveryPassword(email, token)
        await docenteBDD.save()
        res.status(200).json({ msg: "Revisa tu correo electrónico para reestablecer tu cuenta" })
        
    } catch (error) {
        res.status(500).json({ msg: `❌ Error en el servidor - ${error}` })
    }
}


const comprobarTokenPasswordDocente = async (req,res)=>{
    try {
        const {token} = req.params
        const docenteBDD = await Docente.findOne({token})
        if (!docenteBDD) {
            return res.status(404).json({ msg: "Token inválido o expirado" })
        }
        res.status(200).json({ msg: "Token confirmado, puedes crear tu nueva contraseña" })
    
    } catch (error) {
        res.status(500).json({ msg: `❌ Error en el servidor - ${error}` })
    }
}





const crearNuevoPasswordDocente = async (req,res)=>{

    try {
        const{password,confirmpassword} = req.body
        const { token } = req.params
        if (!password || !confirmpassword) {return res.status(400).json({ msg: "Todos los campos son obligatorios" })}
        if(password !== confirmpassword) return res.status(404).json({msg:"Los passwords no coinciden"})
        const docenteBDD = await Docente.findOne({token})
        if(!docenteBDD) return res.status(404).json({msg:"No se puede validar la cuenta"})
        docenteBDD.token = null
        docenteBDD.password = await docenteBDD.encryptPassword(password)
        await docenteBDD.save()
        res.status(200).json({msg:"Felicitaciones, ya puedes iniciar sesión con tu nuevo password"}) 

    } catch (error) {
        res.status(500).json({ msg: `❌ Error en el servidor - ${error}` })
    }
}

const loginDocente = async (req,res)=>{
    try {
        const {email,password} = req.body
        if (Object.values(req.body).includes("")) return res.status(404).json({msg:"Debes llenar todos los campos"})
        const docenteBDD = await Docente.findOne({email}).select("-status -__v -token -updatedAt -createdAt")
        if(!docenteBDD) return res.status(404).json({msg:"El usuario no se encuentra registrado"})
        const verificarPassword = await docenteBDD.matchPassword(password)
        if(!verificarPassword) return res.status(401).json({msg:"El password no es correcto"})
        const {nombre,apellido,direccion,telefono,_id,rol} = docenteBDD
        const token = crearTokenJWT(docenteBDD._id,docenteBDD.rol)
        res.status(200).json({
            rol,
            nombre,
            apellido,
            direccion,
            telefono,
            imagen:docenteBDD.Imagen,
            _id,
            email:docenteBDD.email,
            token
        })
        

    } catch (error) {
        res.status(500).json({ msg: `❌ Error en el servidor - ${error}` })
    }

}

const perfilDocente =(req,res)=>{
	const {token,confirmEmail,createdAt,updatedAt,__v,...datosPerfil} = req.docenteHeader
    res.status(200).json(datosPerfil)
}



const actualizarPerfilDocente = async (req, res) => {
    try {
        const { id } = req.params;

        // Si req.body no existe, esto lanzará el error de tu captura
        if (!req.body) {
            return res.status(400).json({ msg: "No se recibieron datos en el cuerpo de la petición" });
        }

        const { nombre, apellido, direccion, telefono, email } = req.body; // Cambia 'celular' por 'telefono' si es necesario

        if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ msg: "ID inválido" });

        const docenteBDD = await Docente.findById(id);
        if (!docenteBDD) return res.status(404).json({ msg: "No existe el docente" });

        // Actualización
        docenteBDD.nombre = nombre || docenteBDD.nombre;
        docenteBDD.apellido = apellido || docenteBDD.apellido;
        docenteBDD.direccion = direccion || docenteBDD.direccion;
        docenteBDD.telefono = telefono || docenteBDD.telefono; 
        docenteBDD.email = email || docenteBDD.email;

        if (req.files?.subirImagenDocente) {
            const { secure_url, public_id } = await subirImagenDocente(req.files.subirImagenDocente.tempFilePath)

            docenteBDD.imagen = secure_url

            nuevoDocente.imagen = secure_url

        }

        if (req.body.subirBase64Docente) {
            const secure_url = await subirBase64Docente(req.body.subirBase64Docente)

            docenteBDD.imagen = secure_url

            nuevoDocente.imagen = secure_url

        }

        await docenteBDD.save();
        res.status(200).json(docenteBDD);

    } catch (error) {
        // Imprime el error en la consola de Node para rastrearlo mejor
        console.error("Error en actualizarPerfilDocente:", error);
        res.status(500).json({ msg: `❌ Error en el servidor - ${error.message}` });
    }
}

const actualizarPasswordDocente = async (req,res)=>{

    try {
        const {_id} = req.params
        const {passwordactual,passwordnuevo} = req.body
        const docenteBDD = await Docente.findById(req.docenteHeader._id)
        if(!docenteBDD) return res.status(404).json({msg:`Lo sentimos, no existe el veterinario ${_id}`})
        const verificarPassword = await docenteBDD.matchPassword(passwordactual)
        if(!verificarPassword) return res.status(401).json({msg:"Lo sentimos, el password actual no es el correcto"})
        docenteBDD.password = await docenteBDD.encryptPassword(passwordnuevo)
        await docenteBDD.save()

    res.status(200).json({msg:"Password actualizado correctamente"})
    } catch (error) {
        res.status(500).json({ msg: `❌ Error en el servidor - ${error}` })
    }
}

export {
    registroDocente,
    recuperarPasswordDocente,
    comprobarTokenPasswordDocente,
    crearNuevoPasswordDocente,
    loginDocente,
    perfilDocente,
    actualizarPerfilDocente,
    actualizarPasswordDocente,
    
}