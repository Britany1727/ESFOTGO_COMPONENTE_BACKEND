import Estudiante from "../models/Estudiante.js"
import { sendMailToRecoveryPassword } from "../helpers/sendMail.js"
import { crearTokenJWT } from "../middlewares/JWT.js"
import mongoose from "mongoose"
import Evento from "../models/Evento.js"
import Oficina from "../models/Oficinas.js"
import Aula from "../models/Aulas.js"

const registroEstudiante = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ msg: "Lo sentimos, debes llenar todos los campos" });
        }

        // Buscar estudiante pre-registrado en la carga masiva
        const estudianteBDD = await Estudiante.findOne({ email });

        // ❌ No está en la BDD = no autorizado
        if (!estudianteBDD) {
            return res.status(403).json({ 
                msg: "Lo sentimos, tu correo no está autorizado. Contacta al administrador." 
            });
        }

        // ❌ Ya completó su registro
        if (estudianteBDD.password === null || estudianteBDD.Imagen === "") {
            return res.status(400).json({ msg: "Esta cuenta ya se encuentra activa" });
        }

        // ✅ Solo actualizar password e imagen sobre el doc existente
        estudianteBDD.password = await estudianteBDD.encryptPassword(password);

        if (req.files?.subirImagenEstudiante) {
            const { secure_url } = await subirImagenEstudiante(req.files.subirImagenEstudiante.tempFilePath);
            estudianteBDD.imagen = secure_url;
        }

        if (req.body.subirBase64Estudiante) {
            const secure_url = await subirBase64Estudiante(req.body.subirBase64Docente);
            estudianteBDD.imagen = secure_url;
        }

        await estudianteBDD.save();
        res.status(200).json({ msg: "Registrado exitosamente" });

    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: `❌ Error en el servidor - ${error.message}` });
    }
}

const recuperarPasswordEstudiante = async (req, res) => {
    try {
        const { email } = req.body
        if (!email) return res.status(400).json({ msg: "Debes ingresar un correo electrónico" })
        const estudianteBDD = await Estudiante.findOne({ email })
        if (!estudianteBDD) return res.status(404).json({ msg: "El estudiante no se encuentra registrado" })
        const token = estudianteBDD.createToken()
        estudianteBDD.token = token
        await sendMailToRecoveryPassword(email, token)
        await estudianteBDD.save()
        res.status(200).json({ msg: "Revisa tu correo electrónico para reestablecer tu cuenta" })
    } catch (error) {
        res.status(500).json({ msg: `❌ Error en el servidor - ${error}` })
    }
}

const comprobarTokenPasswordEstudiante = async (req, res) => {
    try {
        const { token } = req.params
        const estudianteBDD = await Estudiante.findOne({ token })
        if (!estudianteBDD) return res.status(404).json({ msg: "Token inválido o expirado" })
        res.status(200).json({ msg: "Token confirmado, puedes crear tu nueva contraseña" })
    } catch (error) {
        res.status(500).json({ msg: `❌ Error en el servidor - ${error}` })
    }
}

const crearNuevoPasswordEstudiante = async (req, res) => {
    try {
        const { password, confirmpassword } = req.body
        const { token } = req.params
        if (!password || !confirmpassword) return res.status(400).json({ msg: "Todos los campos son obligatorios" })
        if (password !== confirmpassword) return res.status(404).json({ msg: "Los passwords no coinciden" })
        const estudianteBDD = await Estudiante.findOne({ token })
        if (!estudianteBDD) return res.status(404).json({ msg: "No se puede validar la cuenta" })
        estudianteBDD.token = null
        estudianteBDD.password = await estudianteBDD.encryptPassword(password)
        await estudianteBDD.save()
        res.status(200).json({ msg: "Felicitaciones, ya puedes iniciar sesión con tu nuevo password" })
    } catch (error) {
        res.status(500).json({ msg: `❌ Error en el servidor - ${error}` })
    }
}

const loginEstudiante = async (req, res) => {
    try {
        const { email, password } = req.body
        if (Object.values(req.body).includes("")) return res.status(404).json({ msg: "Debes llenar todos los campos" })
        const estudianteBDD = await Estudiante.findOne({ email })
        if (!estudianteBDD) return res.status(404).json({ msg: "El estudiante no se encuentra registrado" })
        const verificarPassword = await estudianteBDD.matchPassword(password)
        if (!verificarPassword) return res.status(401).json({ msg: "El password no es correcto" })
        const token = crearTokenJWT(estudianteBDD._id, estudianteBDD.rol)
        res.status(200).json({
            rol: estudianteBDD.rol,
            nombre: estudianteBDD.nombre,
            apellido: estudianteBDD.apellido,
            direccion: estudianteBDD.direccion,
            telefono: estudianteBDD.telefono,
            imagen: estudianteBDD.imagen,
            _id: estudianteBDD._id,
            email: estudianteBDD.email,
            token
        })
    } catch (error) {
        res.status(500).json({ msg: `❌ Error en el servidor - ${error}` })
    }
}

const perfilEstudiante = (req, res) => {
    const estudiante = req.userHeader || req.docenteHeader || req.adminHeader;
    if (!estudiante) return res.status(404).json({ msg: "No se pudo obtener la información del perfil" });
    const { token, confirmEmail, createdAt, updatedAt, __v, password, ...datosPerfil } = estudiante;
    res.status(200).json(datosPerfil);
}

const actualizarPerfilEstudiante = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, apellido, direccion, telefono, email } = req.body; 
        if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ msg: `ID inválido` });
        const estudianteBDD = await Estudiante.findById(id);
        if (!estudianteBDD) return res.status(404).json({ msg: "No existe el estudiante" });
        if (estudianteBDD.email !== email) {
            const emailExistente = await Estudiante.findOne({ email });
            if (emailExistente) return res.status(400).json({ msg: "El email ya está registrado" });
        }
        estudianteBDD.nombre = nombre || estudianteBDD.nombre;
        estudianteBDD.apellido = apellido || estudianteBDD.apellido;
        estudianteBDD.direccion = direccion || estudianteBDD.direccion;
        estudianteBDD.telefono = telefono || estudianteBDD.telefono;
        estudianteBDD.email = email || estudianteBDD.email;

        if (req.files?.subirImagenEstudiante) {
            const { secure_url, public_id } = await subirImagenUser(req.files.subirImagenUser.tempFilePath)
            estudianteBDD.imagen = secure_url
        }

        if (req.body.subirBase64Estudiante) {
            const secure_url = await subirBase64Estudiante(req.body.subirBase64Estudiante)
            estudianteBDD.imagen = secure_url
        }

        await estudianteBDD.save();
        res.status(200).json({ msg: "Perfil actualizado con éxito" });
    } catch (error) {
        res.status(500).json({ msg: `❌ Error en el servidor - ${error.message}` });
    }
}

const actualizarPasswordEstudiante = async (req, res) => {
    try {
        const { passwordactual, passwordnuevo } = req.body;
        const estudianteAutenticado = req.estudianteHeader || req.docenteHeader || req.adminHeader;
        const estudianteBDD = await Estudiante.findById(estudianteAutenticado._id);
        const verificarPassword = await estudianteBDD.matchPassword(passwordactual);
        if (!verificarPassword) return res.status(401).json({ msg: "El password actual es incorrecto" });
        estudianteBDD.password = await estudianteBDD.encryptPassword(passwordnuevo);
        await estudianteBDD.save();
        res.status(200).json({ msg: "Password actualizado correctamente" });
    } catch (error) {
        res.status(500).json({ msg: `❌ Error en el servidor - ${error}` })
    }
}

export {
    registroEstudiante,
    recuperarPasswordEstudiante,
    comprobarTokenPasswordEstudiante,
    crearNuevoPasswordEstudiante,
    loginEstudiante,
    perfilEstudiante,
    actualizarPerfilEstudiante,
    actualizarPasswordEstudiante,
};
