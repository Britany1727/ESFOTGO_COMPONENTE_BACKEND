import Admin from "../models/Admin.js";
import { sendMailToRecoveryPassword } from "../helpers/sendMail.js"
import { crearTokenJWT, crearRefreshTokenJWT, guardarRefreshToken } from "../middlewares/JWT.js"
import { successResponse, errorResponse } from "../helpers/response.js"
import mongoose from "mongoose"
import Evento from "../models/Evento.js"
import Estudiante from "../models/Estudiante.js"
import Oficina from "../models/Oficinas.js"
import Aula from "../models/Aulas.js"
import Docente from "../models/Docente.js"
import { 
    subirImagenEvento, subirBase64Evento, 
    subirImagenOficina, subirBase64Oficina, 
    subirImagenAula, subirBase64Aula,
    subirImagenAdmin, subirBase64Admin 
} from "../helpers/uploadCloudinary.js"

// ==========================================
// ADMINISTRADORES - AUTENTICACIÓN Y PERFIL
// ==========================================

const registroAdmin = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (Object.values(req.body).includes("")) {
            return errorResponse(res, "Lo sentimos, debes llenar todos los campos", 400)
        }

        const verificarEmailBDD = await Admin.findOne({ email });
        if (verificarEmailBDD) {
            return errorResponse(res, "Lo sentimos, el email ya se encuentra registrado", 400)
        }

        const nuevoAdmin = new Admin(req.body);
        nuevoAdmin.password = await nuevoAdmin.encryptPassword(password);

        if (req.files?.subirImagenAdmin && typeof subirImagenAdmin === 'function') {
            const { secure_url } = await subirImagenAdmin(req.files.subirImagenAdmin.tempFilePath)
            nuevoAdmin.imagen = secure_url
        }

        if (req.body.subirBase64Admin && typeof subirBase64Admin === 'function') {
            const secure_url = await subirBase64Admin(req.body.subirBase64Admin)
            nuevoAdmin.imagen = secure_url
        }

        await nuevoAdmin.save()
        return successResponse(res, null, "Tu cuenta ha sido creada exitosamente", 201)

    } catch (error) {
        return errorResponse(res, error.message)
    }
}

const recuperarPasswordAdmin = async (req, res) => {
    try {
        const { email } = req.body
        if (!email) return errorResponse(res, "Debes ingresar un correo electrónico", 400)

        const adminBDD = await Admin.findOne({ email })
        if (!adminBDD) return errorResponse(res, "El usuario no se encuentra registrado", 404)

        const token = adminBDD.createToken()
        adminBDD.token = token
        await sendMailToRecoveryPassword(email, token)
        await adminBDD.save()
        return successResponse(res, null, "Revisa tu correo electrónico para reestablecer tu cuenta")

    } catch (error) {
        return errorResponse(res, error.message)
    }
}

const comprobarTokenPasswordAdmin = async (req, res) => {
    try {
        const { token } = req.params
        const adminBDD = await Admin.findOne({ token })
        if (!adminBDD) {
            return errorResponse(res, "Token inválido o expirado", 404)
        }
        return successResponse(res, null, "Token confirmado, puedes crear tu nueva contraseña")

    } catch (error) {
        return errorResponse(res, error.message)
    }
}

const crearNuevoPasswordAdmin = async (req, res) => {
    try {
        const { password, confirmpassword } = req.body
        const { token } = req.params
        if (!password || !confirmpassword) return errorResponse(res, "Todos los campos son obligatorios", 400)
        if (password !== confirmpassword) return errorResponse(res, "Los passwords no coinciden", 400)

        const adminBDD = await Admin.findOne({ token })
        if (!adminBDD) return errorResponse(res, "No se puede validar la cuenta", 404)

        adminBDD.token = null
        adminBDD.password = await adminBDD.encryptPassword(password)
        await adminBDD.save()
        return successResponse(res, null, "Felicitaciones, ya puedes iniciar sesión con tu nuevo password")

    } catch (error) {
        return errorResponse(res, error.message)
    }
}

const loginAdmin = async (req, res) => {
    try {
        const { email, password } = req.body
        if (Object.values(req.body).includes("")) return errorResponse(res, "Debes llenar todos los campos", 400)

        const adminBDD = await Admin.findOne({ email }).select("-status -__v -token -updatedAt -createdAt")
        if (!adminBDD) return errorResponse(res, "El usuario no se encuentra registrado", 404)

        const verificarPassword = await adminBDD.matchPassword(password)
        if (!verificarPassword) return errorResponse(res, "El password no es correcto", 401)

        const { nombre, apellido, direccion, telefono, _id, rol } = adminBDD
        const token = crearTokenJWT(adminBDD._id, adminBDD.rol)
        const refreshToken = crearRefreshTokenJWT(adminBDD._id, adminBDD.rol)
        await guardarRefreshToken(adminBDD._id, 'Admin', refreshToken)

        return successResponse(res, {
            rol,
            nombre,
            apellido,
            direccion,
            telefono,
            imagen: adminBDD.imagen,
            _id,
            email: adminBDD.email,
            token,
            refreshToken
        }, "Inicio de sesión exitoso")

    } catch (error) {
        return errorResponse(res, error.message)
    }
}

const perfilAdmin = (req, res) => {
    const { token, confirmEmail, createdAt, updatedAt, __v, password, ...datosPerfil } = req.adminHeader
    return successResponse(res, datosPerfil)
}

const actualizarPerfilAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, apellido, direccion, telefono, email } = req.body;
        if (!mongoose.Types.ObjectId.isValid(id)) return errorResponse(res, "ID inválido", 400);

        const adminBDD = await Admin.findById(id);
        if (!adminBDD) return errorResponse(res, "No existe el administrador", 404);

        if (adminBDD.email !== email) {
            const emailExistente = await Admin.findOne({ email });
            if (emailExistente) return errorResponse(res, "El email ya está registrado", 400);
        }

        adminBDD.nombre = nombre || adminBDD.nombre;
        adminBDD.apellido = apellido || adminBDD.apellido;
        adminBDD.direccion = direccion || adminBDD.direccion;
        adminBDD.telefono = telefono || adminBDD.telefono;
        adminBDD.email = email || adminBDD.email;

        if (req.files?.subirImagenAdmin && typeof subirImagenAdmin === 'function') {
            const { secure_url } = await subirImagenAdmin(req.files.subirImagenAdmin.tempFilePath)
            adminBDD.imagen = secure_url
        }

        if (req.body.subirBase64Admin && typeof subirBase64Admin === 'function') {
            const secure_url = await subirBase64Admin(req.body.subirBase64Admin)
            adminBDD.imagen = secure_url
        }

        await adminBDD.save();
        return successResponse(res, { admin: adminBDD }, "Perfil actualizado con éxito");
    } catch (error) {
        return errorResponse(res, error.message);
    }
}

const actualizarPasswordAdmin = async (req, res) => {
    try {
        const passwordactual = req.body.passwordactual || req.body.currentPassword
        const passwordnuevo = req.body.passwordnuevo || req.body.newPassword
        const adminBDD = await Admin.findById(req.adminHeader._id)
        if (!adminBDD) return errorResponse(res, "Lo sentimos, no existe el administrador", 404)

        const verificarPassword = await adminBDD.matchPassword(passwordactual)
        if (!verificarPassword) return errorResponse(res, "Lo sentimos, el password actual no es el correcto", 401)

        adminBDD.password = await adminBDD.encryptPassword(passwordnuevo)
        await adminBDD.save()

        return successResponse(res, null, "Password actualizado correctamente")
    } catch (error) {
        return errorResponse(res, error.message)
    }
}

// ==========================================
// EVENTOS
// ==========================================

const crearEvento = async (req, res) => {
    try {
        const { nombre, informacion, fecha, hora, organizador, ubicacion, coordenadas, categoria, fecha_fin } = req.body
        if (!nombre || !informacion || !fecha || !hora || !organizador) {
            return errorResponse(res, "Lo sentimos, debes llenar nombre, informacion, fecha, hora y organizador", 400)
        }

        const nuevoEvento = new Evento({ nombre, informacion, fecha, hora, organizador, ubicacion, coordenadas, categoria, fecha_fin })

        if (req.files?.subirImagenEvento) {
            const { secure_url } = await subirImagenEvento(req.files.subirImagenEvento.tempFilePath)
            nuevoEvento.imagen = secure_url
        }

        if (req.body.subirBase64Evento) {
            const secure_url = await subirBase64Evento(req.body.subirBase64Evento)
            nuevoEvento.imagen = secure_url
        }

        await nuevoEvento.save()
        return successResponse(res, null, "Evento creado correctamente", 201)
    } catch (error) {
        return errorResponse(res, error.message)
    }
}

const actualizarEvento = async (req, res) => {
    try {
        const { id } = req.params
        const { nombre, informacion, fecha, hora, organizador, ubicacion, coordenadas, categoria, fecha_fin } = req.body

        if (Object.values(req.body).includes("")) return errorResponse(res, "Lo sentimos, debes llenar todos los campos", 400)

        const eventoBDD = await Evento.findById(id)
        if (!eventoBDD) return errorResponse(res, "El evento no existe", 404)

        eventoBDD.nombre = nombre || eventoBDD.nombre
        eventoBDD.fecha = fecha || eventoBDD.fecha
        eventoBDD.hora = hora || eventoBDD.hora
        eventoBDD.ubicacion = ubicacion || eventoBDD.ubicacion
        eventoBDD.informacion = informacion || eventoBDD.informacion
        eventoBDD.organizador = organizador || eventoBDD.organizador
        eventoBDD.coordenadas = coordenadas || eventoBDD.coordenadas
        if (categoria !== undefined) eventoBDD.categoria = categoria
        if (fecha_fin !== undefined) eventoBDD.fecha_fin = fecha_fin

        if (req.files?.subirImagenEvento) {
            const { secure_url } = await subirImagenEvento(req.files.subirImagenEvento.tempFilePath)
            eventoBDD.imagen = secure_url
        }
        if (req.body.subirBase64Evento) {
            const secure_url = await subirBase64Evento(req.body.subirBase64Evento)
            eventoBDD.imagen = secure_url
        }

        await eventoBDD.save()
        return successResponse(res, null, "Evento actualizado correctamente")
    } catch (error) {
        return errorResponse(res, error.message)
    }
}

const eliminarEvento = async (req, res) => {
    try {
        const { id } = req.params
        const eventoBDD = await Evento.findById(id)
        if (!eventoBDD) return errorResponse(res, "El evento no existe", 404)

        await eventoBDD.deleteOne()
        return successResponse(res, null, "Evento eliminado correctamente")
    } catch (error) {
        return errorResponse(res, error.message)
    }
}

const toggleStatusEvento = async (req, res) => {
    try {
        const { id } = req.params
        const eventoBDD = await Evento.findById(id)
        if (!eventoBDD) return errorResponse(res, "El evento no existe", 404)

        eventoBDD.status = !eventoBDD.status
        await eventoBDD.save()

        const estado = eventoBDD.status ? 'activado' : 'inactivado'
        return successResponse(res, { _id: eventoBDD._id, status: eventoBDD.status }, `Evento ${estado} correctamente`)
    } catch (error) {
        return errorResponse(res, error.message)
    }
}

const listarEventos = async (req, res) => {
    try {
        const { page = 1, limit = 10, search } = req.query
        const pageNum = parseInt(page)
        const limitNum = parseInt(limit)
        const filter = {}
        if (search) {
            const regex = new RegExp(search, 'i')
            filter.$or = [
                { nombre: regex },
                { informacion: regex },
                { ubicacion: regex },
                { categoria: regex }
            ]
        }
        const eventosBDD = await Evento.find(filter)
            .sort({ createdAt: -1 })
            .skip((pageNum - 1) * limitNum)
            .limit(limitNum)
        return successResponse(res, eventosBDD)
    } catch (error) {
        return errorResponse(res, error.message)
    }
}

const verEvento = async (req, res) => {
    try {
        const { id } = req.params
        const eventoBDD = await Evento.findById(id)
        if (!eventoBDD) return errorResponse(res, "El evento no existe", 404)
        return successResponse(res, eventoBDD)
    } catch (error) {
        return errorResponse(res, error.message)
    }
}

// ==========================================
// DOCENTES
// ==========================================

const listarDocentes = async (req, res) => {
    try {
        const docentesBDD = await Docente.find().select("-password -token -status -__v -createdAt -updatedAt").sort({ createdAt: -1 })
        return successResponse(res, docentesBDD)
    } catch (error) {
        return errorResponse(res, error.message)
    }
}

const verDocente = async (req, res) => {
    try {
        const { id } = req.params
        const docenteBDD = await Docente.findById(id).select("-password -token -status -__v -createdAt -updatedAt")
        if (!docenteBDD) return errorResponse(res, "El docente no existe", 404)
        return successResponse(res, docenteBDD)
    } catch (error) {
        return errorResponse(res, error.message)
    }
}

const buscarDocente = async (req, res) => {
    try {
        const { email } = req.query;
        if (!email) return errorResponse(res, "Debes proporcionar un correo electrónico", 400);
        const docenteBDD = await Docente.findOne({ email }).select("-password -token -__v -updatedAt -createdAt");
        if (!docenteBDD) return errorResponse(res, "No existe el docente", 404);
        return successResponse(res, docenteBDD);
    } catch (error) {
        return errorResponse(res, error.message)
    }
}

const eliminarDocente = async (req, res) => {
    try {
        const { id } = req.params
        const docenteBDD = await Docente.findById(id)
        if (!docenteBDD) return errorResponse(res, "El docente no existe", 404)

        await docenteBDD.deleteOne()
        return successResponse(res, null, "Docente eliminado correctamente")
    } catch (error) {
        return errorResponse(res, error.message)
    }
}

const toggleStatusDocente = async (req, res) => {
    try {
        const { id } = req.params
        const docenteBDD = await Docente.findById(id)
        if (!docenteBDD) return errorResponse(res, "El docente no existe", 404)

        docenteBDD.status = !docenteBDD.status
        await docenteBDD.save()

        const estado = docenteBDD.status ? 'activado' : 'inactivado'
        return successResponse(res, { _id: docenteBDD._id, status: docenteBDD.status }, `Docente ${estado} correctamente`)
    } catch (error) {
        return errorResponse(res, error.message)
    }
}

// ==========================================
// OFICINAS
// ==========================================

const crearOficinas = async (req, res) => {
    try {
        const { numero, ubicacion, encargado, telefono, piso, coordenadas } = req.body
        if (!numero || !ubicacion) return errorResponse(res, "Lo sentimos, debes llenar numero y ubicacion", 400)

        const nuevaOficina = new Oficina({ numero, ubicacion, encargado, telefono, piso, coordenadas })

        if (req.files?.subirImagenOficina) {
            const { secure_url } = await subirImagenOficina(req.files.subirImagenOficina.tempFilePath)
            nuevaOficina.imagen = secure_url
        }
        if (req.body.subirBase64Oficina) {
            const secure_url = await subirBase64Oficina(req.body.subirBase64Oficina)
            nuevaOficina.imagen = secure_url
        }

        await nuevaOficina.save()
        return successResponse(res, { oficina: nuevaOficina }, "Oficina creada correctamente", 201)
    } catch (error) {
        return errorResponse(res, error.message)
    }
}

const listarOficinas = async (req, res) => {
    try {
        const oficinasBDD = await Oficina.find().sort({ createdAt: -1 })
        return successResponse(res, oficinasBDD)
    } catch (error) {
        return errorResponse(res, error.message)
    }
}

const verOficina = async (req, res) => {
    try {
        const { id } = req.params
        const oficinaBDD = await Oficina.findById(id)
        if (!oficinaBDD) return errorResponse(res, "La oficina no existe", 404)
        return successResponse(res, oficinaBDD)
    } catch (error) {
        return errorResponse(res, error.message)
    }
}

const actualizarOficina = async (req, res) => {
    try {
        const { id } = req.params
        const { numero, ubicacion, encargado, telefono, piso, coordenadas } = req.body

        if (Object.values(req.body).includes("")) return errorResponse(res, "Lo sentimos, debes llenar todos los campos", 400)

        const oficinaBDD = await Oficina.findById(id)
        if (!oficinaBDD) return errorResponse(res, "La oficina no existe", 404)

        oficinaBDD.numero = numero || oficinaBDD.numero
        oficinaBDD.ubicacion = ubicacion || oficinaBDD.ubicacion
        oficinaBDD.encargado = encargado || oficinaBDD.encargado
        oficinaBDD.telefono = telefono || oficinaBDD.telefono
        oficinaBDD.piso = piso || oficinaBDD.piso
        oficinaBDD.coordenadas = coordenadas || oficinaBDD.coordenadas

        if (req.files?.subirImagenOficina) {
            const { secure_url } = await subirImagenOficina(req.files.subirImagenOficina.tempFilePath)
            oficinaBDD.imagen = secure_url
        }
        if (req.body.subirBase64Oficina) {
            const secure_url = await subirBase64Oficina(req.body.subirBase64Oficina)
            oficinaBDD.imagen = secure_url
        }

        await oficinaBDD.save()
        return successResponse(res, null, "Oficina actualizada correctamente")
    } catch (error) {
        return errorResponse(res, error.message)
    }
}

const eliminarOficina = async (req, res) => {
    try {
        const { id } = req.params
        const oficinaBDD = await Oficina.findById(id)
        if (!oficinaBDD) return errorResponse(res, "La oficina no existe", 404)

        await oficinaBDD.deleteOne()
        return successResponse(res, null, "Oficina eliminada correctamente")
    } catch (error) {
        return errorResponse(res, error.message)
    }
}

// ==========================================
// AULAS
// ==========================================

const crearAulas = async (req, res) => {
    try {
        const { numero, nombre, ubicacion, tipo, piso, coordenadas, estado } = req.body
        if (!numero || !ubicacion || !tipo) {
            return errorResponse(res, "Lo sentimos, debes llenar numero, ubicacion y tipo", 400)
        }

        const nuevaAula = new Aula({ numero, nombre: nombre || numero, ubicacion, tipo, piso, coordenadas, estado })

        if (req.files?.subirImagenAula) {
            const { secure_url } = await subirImagenAula(req.files.subirImagenAula.tempFilePath)
            nuevaAula.imagen = secure_url
        }
        if (req.body.subirBase64Aula) {
            const secure_url = await subirBase64Aula(req.body.subirBase64Aula)
            nuevaAula.imagen = secure_url
        }

        await nuevaAula.save()
        return successResponse(res, { aula: nuevaAula }, "Aula creada correctamente", 201)
    } catch (error) {
        return errorResponse(res, error.message)
    }
}

const actualizarAula = async (req, res) => {
    try {
        const { id } = req.params
        const { numero, nombre, ubicacion, tipo, piso, coordenadas, estado } = req.body

        if (Object.values(req.body).includes("")) return errorResponse(res, "Lo sentimos, debes llenar todos los campos", 400)

        const aulaBDD = await Aula.findById(id)
        if (!aulaBDD) return errorResponse(res, "El aula no existe", 404)

        if (numero !== undefined) aulaBDD.numero = numero
        if (nombre !== undefined) aulaBDD.nombre = nombre
        if (ubicacion !== undefined) aulaBDD.ubicacion = ubicacion
        if (tipo !== undefined) aulaBDD.tipo = tipo
        if (piso !== undefined) aulaBDD.piso = piso
        if (coordenadas !== undefined) aulaBDD.coordenadas = coordenadas
        if (estado !== undefined) aulaBDD.estado = estado

        if (req.files?.subirImagenAula) {
            const { secure_url } = await subirImagenAula(req.files.subirImagenAula.tempFilePath)
            aulaBDD.imagen = secure_url
        }
        if (req.body.subirBase64Aula) {
            const secure_url = await subirBase64Aula(req.body.subirBase64Aula)
            aulaBDD.imagen = secure_url
        }

        await aulaBDD.save()
        return successResponse(res, null, "Aula actualizada correctamente")
    } catch (error) {
        return errorResponse(res, error.message)
    }
}

const listarAulas = async (req, res) => {
    try {
        const aulasBDD = await Aula.find().sort({ createdAt: -1 })
        return successResponse(res, aulasBDD)
    } catch (error) {
        return errorResponse(res, error.message)
    }
}

const verAula = async (req, res) => {
    try {
        const { id } = req.params
        const aulaBDD = await Aula.findById(id)
        if (!aulaBDD) return errorResponse(res, "El aula no existe", 404)
        return successResponse(res, aulaBDD)
    } catch (error) {
        return errorResponse(res, error.message)
    }
}

const eliminarAula = async (req, res) => {
    try {
        const { id } = req.params
        const aulaBDD = await Aula.findById(id)
        if (!aulaBDD) return errorResponse(res, "El aula no existe", 404)

        await aulaBDD.deleteOne()
        return successResponse(res, null, "Aula eliminada correctamente")
    } catch (error) {
        return errorResponse(res, error.message)
    }
}

// ==========================================
// ESTUDIANTES
// ==========================================

const listarEstudiantes = async (req, res) => {
    try {
        const estudiantesBDD = await Estudiante.find().sort({ createdAt: -1 })
        return successResponse(res, estudiantesBDD)
    } catch (error) {
        return errorResponse(res, error.message)
    }
}

const verEstudiante = async (req, res) => {
    try {
        const { id } = req.params
        const estudianteBDD = await Estudiante.findById(id)
        if (!estudianteBDD) return errorResponse(res, "El estudiante no existe", 404)
        return successResponse(res, estudianteBDD)
    } catch (error) {
        return errorResponse(res, error.message)
    }
}

const buscarEstudiante = async (req, res) => {
    try {
        const { email } = req.query;
        if (!email) return errorResponse(res, "Debes proporcionar un correo electrónico", 400);
        const estudianteBDD = await Estudiante.findOne({ email }).select("-password -token -__v -updatedAt -createdAt");
        if (!estudianteBDD) return errorResponse(res, "No existe el estudiante", 404);
        return successResponse(res, estudianteBDD);
    } catch (error) {
        return errorResponse(res, error.message)
    }
}

const eliminarEstudiante = async (req, res) => {
    try {
        const { id } = req.params
        const estudianteBDD = await Estudiante.findById(id)
        if (!estudianteBDD) return errorResponse(res, "El estudiante no existe", 404)

        await estudianteBDD.deleteOne()
        return successResponse(res, null, "Estudiante eliminado correctamente")
    } catch (error) {
        return errorResponse(res, error.message)
    }
}

const toggleStatusEstudiante = async (req, res) => {
    try {
        const { id } = req.params
        const estudianteBDD = await Estudiante.findById(id)
        if (!estudianteBDD) return errorResponse(res, "El estudiante no existe", 404)

        estudianteBDD.status = !estudianteBDD.status
        await estudianteBDD.save()

        const estado = estudianteBDD.status ? 'activado' : 'inactivado'
        return successResponse(res, { _id: estudianteBDD._id, status: estudianteBDD.status }, `Estudiante ${estado} correctamente`)
    } catch (error) {
        return errorResponse(res, error.message)
    }
}

const crearEstudianteAdmin = async (req, res) => {
    try {
        const { nombre, apellido, email, telefono, password } = req.body
        if (!nombre || !email || !password) {
            return errorResponse(res, "Debes llenar nombre, email y password", 400)
        }
        const existeEmail = await Estudiante.findOne({ email })
        if (existeEmail) {
            return errorResponse(res, "El email ya se encuentra registrado", 400)
        }
        const nuevoEstudiante = new Estudiante({ nombre, apellido, email, telefono })
        nuevoEstudiante.password = await nuevoEstudiante.encryptPassword(password)
        await nuevoEstudiante.save()
        return successResponse(res, { estudiante: nuevoEstudiante }, "Estudiante creado exitosamente", 201)
    } catch (error) {
        return errorResponse(res, error.message)
    }
}

const crearDocenteAdmin = async (req, res) => {
    try {
        const { nombre, apellido, email, telefono, password } = req.body
        if (!nombre || !email || !password) {
            return errorResponse(res, "Debes llenar nombre, email y password", 400)
        }
        const existeEmail = await Docente.findOne({ email })
        if (existeEmail) {
            return errorResponse(res, "El email ya se encuentra registrado", 400)
        }
        const nuevoDocente = new Docente({ nombre, apellido, email, telefono })
        nuevoDocente.password = await nuevoDocente.encryptPassword(password)
        await nuevoDocente.save()
        return successResponse(res, { docente: nuevoDocente }, "Docente creado exitosamente", 201)
    } catch (error) {
        return errorResponse(res, error.message)
    }
}
    
export {
    registroAdmin,
    recuperarPasswordAdmin,
    comprobarTokenPasswordAdmin,
    crearNuevoPasswordAdmin,
    loginAdmin,
    perfilAdmin,
    actualizarPerfilAdmin,
    actualizarPasswordAdmin,
    crearEvento,
    actualizarEvento,
    eliminarEvento,
    toggleStatusEvento,
    listarEventos,
    verEvento,
    listarDocentes,
    verDocente,
    buscarDocente,
    eliminarDocente,
    toggleStatusDocente,
    crearOficinas,
    listarOficinas,
    verOficina,
    actualizarOficina,
    eliminarOficina,
    crearAulas,
    actualizarAula,
    listarAulas,
    verAula,
    eliminarAula,
    listarEstudiantes,
    verEstudiante,
    buscarEstudiante,   
    eliminarEstudiante,
    toggleStatusEstudiante,
    crearEstudianteAdmin,
    crearDocenteAdmin
}
