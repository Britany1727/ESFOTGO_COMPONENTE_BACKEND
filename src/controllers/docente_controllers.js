import Docente from "../models/Docente.js"
import { sendMailToRecoveryPassword } from "../helpers/sendMail.js"
import { crearTokenJWT, crearRefreshTokenJWT, guardarRefreshToken } from "../middlewares/JWT.js"
import { successResponse, errorResponse } from "../helpers/response.js"
import mongoose from "mongoose"



const registroDocente = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return errorResponse(res, "Lo sentimos, debes llenar todos los campos", 400);
        }

        const docenteBDD = await Docente.findOne({ email });

        if (!docenteBDD) {
            return errorResponse(res, "Lo sentimos, tu correo no está autorizado. Contacta al administrador.", 403);
        }

        if (docenteBDD.password != null && docenteBDD.password !== "") {
            return errorResponse(res, "Esta cuenta ya se encuentra activa", 400);
        }

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
        return successResponse(res, null, "Registrado exitosamente");

    } catch (error) {
        return errorResponse(res, error.message);
    }
}

const recuperarPasswordDocente = async (req, res) => {
    try {
        const { email } = req.body
        if (!email) return errorResponse(res, "Debes ingresar un correo electrónico", 400)
        const docenteBDD = await Docente.findOne({ email })
        if (!docenteBDD) return errorResponse(res, "El usuario no se encuentra registrado", 404)
        const token = docenteBDD.createToken()
        docenteBDD.token = token
        await sendMailToRecoveryPassword(email, token)
        await docenteBDD.save()
        return successResponse(res, null, "Revisa tu correo electrónico para reestablecer tu cuenta")
    } catch (error) {
        return errorResponse(res, error.message)
    }
}

const comprobarTokenPasswordDocente = async (req, res) => {
    try {
        const { token } = req.params
        const docenteBDD = await Docente.findOne({ token })
        if (!docenteBDD) {
            return errorResponse(res, "Token inválido o expirado", 404)
        }
        return successResponse(res, null, "Token confirmado, puedes crear tu nueva contraseña")
    } catch (error) {
        return errorResponse(res, error.message)
    }
}

const crearNuevoPasswordDocente = async (req, res) => {
    try {
        const { password, confirmpassword } = req.body
        const { token } = req.params
        if (!password || !confirmpassword) { return errorResponse(res, "Todos los campos son obligatorios", 400) }
        if (password !== confirmpassword) return errorResponse(res, "Los passwords no coinciden", 400)
        const docenteBDD = await Docente.findOne({ token })
        if (!docenteBDD) return errorResponse(res, "No se puede validar la cuenta", 404)
        docenteBDD.token = null
        docenteBDD.password = await docenteBDD.encryptPassword(password)
        await docenteBDD.save()
        return successResponse(res, null, "Felicitaciones, ya puedes iniciar sesión con tu nuevo password")
    } catch (error) {
        return errorResponse(res, error.message)
    }
}

const loginDocente = async (req, res) => {
    try {
        const { email, password } = req.body
        if (Object.values(req.body).includes("")) return errorResponse(res, "Debes llenar todos los campos", 400)
        const docenteBDD = await Docente.findOne({ email }).select("-status -__v -token -updatedAt -createdAt")
        if (!docenteBDD) return errorResponse(res, "El usuario no se encuentra registrado", 404)
        const verificarPassword = await docenteBDD.matchPassword(password)
        if (!verificarPassword) return errorResponse(res, "El password no es correcto", 401)
        const { nombre, apellido, direccion, telefono, _id, rol } = docenteBDD
        const token = crearTokenJWT(docenteBDD._id, docenteBDD.rol)
        const refreshToken = crearRefreshTokenJWT(docenteBDD._id, docenteBDD.rol)
        await guardarRefreshToken(docenteBDD._id, 'Docente', refreshToken)
        return successResponse(res, {
            rol,
            nombre,
            apellido,
            direccion,
            telefono,
            imagen: docenteBDD.imagen,
            _id,
            email: docenteBDD.email,
            token,
            refreshToken
        }, "Inicio de sesión exitoso")
    } catch (error) {
        return errorResponse(res, error.message)
    }
}

const perfilDocente = (req, res) => {
    const { token, confirmEmail, createdAt, updatedAt, __v, ...datosPerfil } = req.docenteHeader
    return successResponse(res, datosPerfil)
}

const actualizarPerfilDocente = async (req, res) => {
    try {
        const { id } = req.params;

        if (!req.body) {
            return errorResponse(res, "No se recibieron datos en el cuerpo de la petición", 400);
        }

        const { nombre, apellido, direccion, telefono, email } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) return errorResponse(res, "ID inválido", 400);

        const docenteBDD = await Docente.findById(id);
        if (!docenteBDD) return errorResponse(res, "No existe el docente", 404);

        docenteBDD.nombre = nombre || docenteBDD.nombre;
        docenteBDD.apellido = apellido || docenteBDD.apellido;
        docenteBDD.direccion = direccion || docenteBDD.direccion;
        docenteBDD.telefono = telefono || docenteBDD.telefono;
        docenteBDD.email = email || docenteBDD.email;

        if (req.files?.subirImagenDocente) {
            const { secure_url } = await subirImagenDocente(req.files.subirImagenDocente.tempFilePath)
            docenteBDD.imagen = secure_url
        }

        if (req.body.subirBase64Docente) {
            const secure_url = await subirBase64Docente(req.body.subirBase64Docente)
            docenteBDD.imagen = secure_url
        }

        await docenteBDD.save();
        return successResponse(res, docenteBDD, "Perfil actualizado con éxito");
    } catch (error) {
        return errorResponse(res, error.message);
    }
}

const actualizarPasswordDocente = async (req, res) => {
    try {
        const { passwordactual, passwordnuevo } = req.body
        const docenteBDD = await Docente.findById(req.docenteHeader._id)
        if (!docenteBDD) return errorResponse(res, "Lo sentimos, no existe el docente", 404)
        const verificarPassword = await docenteBDD.matchPassword(passwordactual)
        if (!verificarPassword) return errorResponse(res, "Lo sentimos, el password actual no es el correcto", 401)
        docenteBDD.password = await docenteBDD.encryptPassword(passwordnuevo)
        await docenteBDD.save()
        return successResponse(res, null, "Password actualizado correctamente")
    } catch (error) {
        return errorResponse(res, error.message)
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