import Estudiante from "../models/Estudiante.js"
import { sendMailToRecoveryPassword } from "../helpers/sendMail.js"
import { crearTokenJWT, crearRefreshTokenJWT, guardarRefreshToken } from "../middlewares/JWT.js"
import { successResponse, errorResponse } from "../helpers/response.js"
import mongoose from "mongoose"

const registroEstudiante = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return errorResponse(res, "Lo sentimos, debes llenar todos los campos", 400);
        }

        const estudianteBDD = await Estudiante.findOne({ email });

        if (!estudianteBDD) {
            return errorResponse(res, "Lo sentimos, tu correo no está autorizado. Contacta al administrador.", 403);
        }

        if (estudianteBDD.password != null && estudianteBDD.password !== "") {
            return errorResponse(res, "Esta cuenta ya se encuentra activa", 400);
        }

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
        return successResponse(res, null, "Registrado exitosamente");

    } catch (error) {
        return errorResponse(res, error.message);
    }
}

const recuperarPasswordEstudiante = async (req, res) => {
    try {
        const { email } = req.body
        if (!email) return errorResponse(res, "Debes ingresar un correo electrónico", 400)
        const estudianteBDD = await Estudiante.findOne({ email })
        if (!estudianteBDD) return errorResponse(res, "El estudiante no se encuentra registrado", 404)
        const token = estudianteBDD.createToken()
        estudianteBDD.token = token
        await sendMailToRecoveryPassword(email, token)
        await estudianteBDD.save()
        return successResponse(res, null, "Revisa tu correo electrónico para reestablecer tu cuenta")
    } catch (error) {
        return errorResponse(res, error.message)
    }
}

const comprobarTokenPasswordEstudiante = async (req, res) => {
    try {
        const { token } = req.params
        const estudianteBDD = await Estudiante.findOne({ token })
        if (!estudianteBDD) return errorResponse(res, "Token inválido o expirado", 404)
        return successResponse(res, null, "Token confirmado, puedes crear tu nueva contraseña")
    } catch (error) {
        return errorResponse(res, error.message)
    }
}

const crearNuevoPasswordEstudiante = async (req, res) => {
    try {
        const { password, confirmpassword } = req.body
        const { token } = req.params
        if (!password || !confirmpassword) return errorResponse(res, "Todos los campos son obligatorios", 400)
        if (password !== confirmpassword) return errorResponse(res, "Los passwords no coinciden", 400)
        const estudianteBDD = await Estudiante.findOne({ token })
        if (!estudianteBDD) return errorResponse(res, "No se puede validar la cuenta", 404)
        estudianteBDD.token = null
        estudianteBDD.password = await estudianteBDD.encryptPassword(password)
        await estudianteBDD.save()
        return successResponse(res, null, "Felicitaciones, ya puedes iniciar sesión con tu nuevo password")
    } catch (error) {
        return errorResponse(res, error.message)
    }
}

const loginEstudiante = async (req, res) => {
    try {
        const { email, password } = req.body
        if (Object.values(req.body).includes("")) return errorResponse(res, "Debes llenar todos los campos", 400)
        const estudianteBDD = await Estudiante.findOne({ email })
        if (!estudianteBDD) return errorResponse(res, "El estudiante no se encuentra registrado", 404)
        const verificarPassword = await estudianteBDD.matchPassword(password)
        if (!verificarPassword) return errorResponse(res, "El password no es correcto", 401)
        const token = crearTokenJWT(estudianteBDD._id, estudianteBDD.rol)
        const refreshToken = crearRefreshTokenJWT(estudianteBDD._id, estudianteBDD.rol)
        await guardarRefreshToken(estudianteBDD._id, 'Estudiante', refreshToken)
        return successResponse(res, {
            rol: estudianteBDD.rol,
            nombre: estudianteBDD.nombre,
            apellido: estudianteBDD.apellido,
            direccion: estudianteBDD.direccion,
            telefono: estudianteBDD.telefono,
            imagen: estudianteBDD.imagen,
            _id: estudianteBDD._id,
            email: estudianteBDD.email,
            token,
            refreshToken
        }, "Inicio de sesión exitoso")
    } catch (error) {
        return errorResponse(res, error.message)
    }
}

const perfilEstudiante = (req, res) => {
    const estudiante = req.userHeader || req.docenteHeader || req.adminHeader;
    if (!estudiante) return errorResponse(res, "No se pudo obtener la información del perfil", 404);
    const { token, confirmEmail, createdAt, updatedAt, __v, password, ...datosPerfil } = estudiante;
    return successResponse(res, datosPerfil);
}

const actualizarPerfilEstudiante = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, apellido, direccion, telefono, email } = req.body;
        if (!mongoose.Types.ObjectId.isValid(id)) return errorResponse(res, "ID inválido", 400);
        const estudianteBDD = await Estudiante.findById(id);
        if (!estudianteBDD) return errorResponse(res, "No existe el estudiante", 404);
        if (estudianteBDD.email !== email) {
            const emailExistente = await Estudiante.findOne({ email });
            if (emailExistente) return errorResponse(res, "El email ya está registrado", 400);
        }
        estudianteBDD.nombre = nombre || estudianteBDD.nombre;
        estudianteBDD.apellido = apellido || estudianteBDD.apellido;
        estudianteBDD.direccion = direccion || estudianteBDD.direccion;
        estudianteBDD.telefono = telefono || estudianteBDD.telefono;
        estudianteBDD.email = email || estudianteBDD.email;

        if (req.files?.subirImagenEstudiante) {
            const { secure_url } = await subirImagenEstudiante(req.files.subirImagenEstudiante.tempFilePath)
            estudianteBDD.imagen = secure_url
        }

        if (req.body.subirBase64Estudiante) {
            const secure_url = await subirBase64Estudiante(req.body.subirBase64Estudiante)
            estudianteBDD.imagen = secure_url
        }

        await estudianteBDD.save();
        return successResponse(res, null, "Perfil actualizado con éxito");
    } catch (error) {
        return errorResponse(res, error.message);
    }
}

const actualizarPasswordEstudiante = async (req, res) => {
    try {
        const { passwordactual, passwordnuevo } = req.body;
        const estudianteAutenticado = req.userHeader || req.docenteHeader || req.adminHeader;
        const estudianteBDD = await Estudiante.findById(estudianteAutenticado._id);
        const verificarPassword = await estudianteBDD.matchPassword(passwordactual);
        if (!verificarPassword) return errorResponse(res, "El password actual es incorrecto", 401);
        estudianteBDD.password = await estudianteBDD.encryptPassword(passwordnuevo);
        await estudianteBDD.save();
        return successResponse(res, null, "Password actualizado correctamente");
    } catch (error) {
        return errorResponse(res, error.message)
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
