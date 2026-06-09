import Admin from "../models/Admin.js";
import { sendMailToRecoveryPassword } from "../helpers/sendMail.js"
import { crearTokenJWT } from "../middlewares/JWT.js"
import mongoose from "mongoose"
import Evento from "../models/Evento.js"
import Estudiante from "../models/Estudiante.js"
import Oficina from "../models/Oficinas.js"
import Aula from "../models/Aulas.js"
import Docente from "../models/Docente.js"
import { 
    subirImagenEvento, subirBase64Evento, 
    subirImagenOficina, subirBase64Oficina, 
    subirImagenAula, subirBase64Aula 
} from "../helpers/uploadCloudinary.js"

// ==========================================
// ADMINISTRADORES - AUTENTICACIÓN Y PERFIL
// ==========================================

const registroAdmin = async (req, res) => {
    try {
        const { email, password } = req.body; 
        if (Object.values(req.body).includes("")) {
            return res.status(400).json({ msg: "Lo sentimos, debes llenar todos los campos" });
        }
        
        const verificarEmailBDD = await Admin.findOne({ email });
        if (verificarEmailBDD) {
            return res.status(400).json({ msg: "Lo sentimos, el email ya se encuentra registrado" });
        }
        
        const nuevoAdmin = new Admin(req.body);
        nuevoAdmin.password = await nuevoAdmin.encryptPassword(password);
        
        // Manejo de imágenes (Asegúrate de que estas funciones estén importadas si se usan)
        if (req.files?.subirImagenAdmin && typeof subirImagenAdmin === 'function') {
            const { secure_url } = await subirImagenAdmin(req.files.subirImagenAdmin.tempFilePath)
            nuevoAdmin.imagen = secure_url
        }

        if (req.body.subirBase64Admin && typeof subirBase64Admin === 'function') {
            const secure_url = await subirBase64Admin(req.body.subirBase64Admin)
            nuevoAdmin.imagen = secure_url
        }
        
        await nuevoAdmin.save()
        res.status(200).json({ msg: "Tu cuenta ha sido creada exitosamente" });

    } catch (error) {
        res.status(500).json({ msg: `❌ Error en el servidor - ${error.message}` });
    }
}

const recuperarPasswordAdmin = async (req, res) => {
    try {
        const { email } = req.body
        if (!email) return res.status(400).json({ msg: "Debes ingresar un correo electrónico" })
        
        const adminBDD = await Admin.findOne({ email })
        if (!adminBDD) return res.status(404).json({ msg: "El usuario no se encuentra registrado" })
        
        const token = adminBDD.createToken()
        adminBDD.token = token
        await sendMailToRecoveryPassword(email, token)
        await adminBDD.save()
        res.status(200).json({ msg: "Revisa tu correo electrónico para reestablecer tu cuenta" })
        
    } catch (error) {
        res.status(500).json({ msg: `❌ Error en el servidor - ${error.message}` })
    }
}

const comprobarTokenPasswordAdmin = async (req, res) => {
    try {
        const { token } = req.params
        const adminBDD = await Admin.findOne({ token })
        if (!adminBDD) {
            return res.status(404).json({ msg: "Token inválido o expirado" })
        }
        res.status(200).json({ msg: "Token confirmado, puedes crear tu nueva contraseña" })
    
    } catch (error) {
        res.status(500).json({ msg: `❌ Error en el servidor - ${error.message}` })
    }
}

const crearNuevoPasswordAdmin = async (req, res) => {
    try {
        const { password, confirmpassword } = req.body
        const { token } = req.params
        if (!password || !confirmpassword) return res.status(400).json({ msg: "Todos los campos son obligatorios" })
        if (password !== confirmpassword) return res.status(404).json({ msg: "Los passwords no coinciden" })
        
        const adminBDD = await Admin.findOne({ token })
        if (!adminBDD) return res.status(404).json({ msg: "No se puede validar la cuenta" })
        
        adminBDD.token = null
        adminBDD.password = await adminBDD.encryptPassword(password)
        await adminBDD.save()
        res.status(200).json({ msg: "Felicitaciones, ya puedes iniciar sesión con tu nuevo password" }) 

    } catch (error) {
        res.status(500).json({ msg: `❌ Error en el servidor - ${error.message}` })
    }
}

const loginAdmin = async (req, res) => {
    try {
        const { email, password } = req.body
        if (Object.values(req.body).includes("")) return res.status(404).json({ msg: "Debes llenar todos los campos" })
        
        const adminBDD = await Admin.findOne({ email }).select("-status -__v -token -updatedAt -createdAt")
        if (!adminBDD) return res.status(404).json({ msg: "El usuario no se encuentra registrado" })
        
        const verificarPassword = await adminBDD.matchPassword(password)
        if (!verificarPassword) return res.status(401).json({ msg: "El password no es correcto" })
        
        const { nombre, apellido, direccion, telefono, _id, rol } = adminBDD
        const token = crearTokenJWT(adminBDD._id, adminBDD.rol)
        
        res.status(200).json({
            rol,
            nombre,
            apellido,
            direccion,
            telefono,
            imagen: adminBDD.imagen,
            _id,
            email: adminBDD.email,
            token
        })
        
    } catch (error) {
        res.status(500).json({ msg: `❌ Error en el servidor - ${error.message}` })
    }
}

const perfilAdmin = (req, res) => {
    const { token, confirmEmail, createdAt, updatedAt, __v, password, ...datosPerfil } = req.adminHeader 
    res.status(200).json(datosPerfil)
}

const actualizarPerfilAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, apellido, direccion, telefono, email } = req.body; 
        if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ msg: `ID inválido` });
        
        const adminBDD = await Admin.findById(id);
        if (!adminBDD) return res.status(404).json({ msg: "No existe el administrador" });
        if (Object.values(req.body).includes("")) return res.status(400).json({ msg: "Debes llenar todos los campos" });
        
        if (adminBDD.email !== email) {
            const emailExistente = await Admin.findOne({ email });
            if (emailExistente) return res.status(400).json({ msg: "El email ya está registrado" });
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
        res.status(200).json({ msg: "Perfil actualizado con éxito", adminBDD });
    } catch (error) {
        res.status(500).json({ msg: `❌ Error en el servidor - ${error.message}` });
    }
}

const actualizarPasswordAdmin = async (req, res) => {
    try {
        const { id } = req.params
        const { passwordactual, passwordnuevo } = req.body
        const adminBDD = await Admin.findById(req.adminHeader._id)
        if (!adminBDD) return res.status(404).json({ msg: `Lo sentimos, no existe el administrador` })
        
        const verificarPassword = await adminBDD.matchPassword(passwordactual)
        if (!verificarPassword) return res.status(401).json({ msg: "Lo sentimos, el password actual no es el correcto" })
        
        adminBDD.password = await adminBDD.encryptPassword(passwordnuevo)
        await adminBDD.save()

        res.status(200).json({ msg: "Password actualizado correctamente" })
    } catch (error) {
        res.status(500).json({ msg: `❌ Error en el servidor - ${error.message}` })
    }
}

// ==========================================
// EVENTOS
// ==========================================

const crearEvento = async (req, res) => {
    try {
        const { nombre, informacion, fecha, hora, organizador, ubicacion, coordenadas } = req.body
        if (!nombre || !informacion || !fecha || !hora || !organizador) {
            return res.status(400).json({ msg: "Lo sentimos, debes llenar nombre, informacion, fecha, hora y organizador" })
        }
        
        const nuevoEvento = new Evento({ nombre, informacion, fecha, hora, organizador, ubicacion, coordenadas })

        if (req.files?.subirImagenEvento) {
            const { secure_url } = await subirImagenEvento(req.files.subirImagenEvento.tempFilePath)
            nuevoEvento.imagen = secure_url
        }

        if (req.body.subirBase64Evento) {
            const secure_url = await subirBase64Evento(req.body.subirBase64Evento)
            nuevoEvento.imagen = secure_url
        }

        await nuevoEvento.save()
        res.status(200).json({ msg: "Evento creado correctamente" })
    } catch (error) {
        res.status(500).json({ msg: `❌ Error en el servidor - ${error.message}` })
    }
}

const actualizarEvento = async (req, res) => {
    try {
        const { id } = req.params
        const { nombre, informacion, fecha, hora, organizador, ubicacion, coordenadas, descripcion, encargado } = req.body

        if (Object.values(req.body).includes("")) return res.status(400).json({ msg: "Lo sentimos, debes llenar todos los campos" })
        
        const eventoBDD = await Evento.findById(id)
        if (!eventoBDD) return res.status(404).json({ msg: "El evento no existe" })
        
        eventoBDD.nombre = nombre || eventoBDD.nombre
        eventoBDD.descripcion = descripcion || eventoBDD.descripcion
        eventoBDD.fecha = fecha || eventoBDD.fecha
        eventoBDD.hora = hora || eventoBDD.hora
        eventoBDD.encargado = encargado || eventoBDD.encargado
        eventoBDD.ubicacion = ubicacion || eventoBDD.ubicacion
        eventoBDD.informacion = informacion || eventoBDD.informacion
        eventoBDD.organizador = organizador || eventoBDD.organizador
        eventoBDD.coordenadas = coordenadas || eventoBDD.coordenadas

        if (req.files?.subirImagenEvento) {
            const { secure_url } = await subirImagenEvento(req.files.subirImagenEvento.tempFilePath)
            eventoBDD.imagen = secure_url
        }
        if (req.body.subirBase64Evento) {
            const secure_url = await subirBase64Evento(req.body.subirBase64Evento)
            eventoBDD.imagen = secure_url
        }
        
        await eventoBDD.save()
        res.status(200).json({ msg: "Evento actualizado correctamente" })
    } catch (error) {
        res.status(500).json({ msg: `❌ Error en el servidor - ${error.message}` })
    }
}

const eliminarEvento = async (req, res) => {
    try {
        const { id } = req.params
        const eventoBDD = await Evento.findById(id) 
        if (!eventoBDD) return res.status(404).json({ msg: "El evento no existe" })
        
        await eventoBDD.deleteOne()
        res.status(200).json({ msg: "Evento eliminado correctamente" })
    } catch (error) {        
        res.status(500).json({ msg: `❌ Error en el servidor - ${error.message}` })
    }
}

const listarEventos = async (req, res) => {
    try {
        const eventosBDD = await Evento.find().sort({ createdAt: -1 })
        res.status(200).json(eventosBDD)
    } catch (error) {
        res.status(500).json({ msg: `❌ Error en el servidor - ${error.message}` })
    }
}

const verEvento = async (req, res) => {
    try {
        const { id } = req.params
        const eventoBDD = await Evento.findById(id)
        if (!eventoBDD) return res.status(404).json({ msg: "El evento no existe" })
        res.status(200).json(eventoBDD)
    } catch (error) {
        res.status(500).json({ msg: `❌ Error en el servidor - ${error.message}` })
    }  
}

// ==========================================
// DOCENTES
// ==========================================

const listarDocentes = async (req, res) => {
    try {
        const docentesBDD = await Docente.find().select("-password -token -status -__v -createdAt -updatedAt").sort({ createdAt: -1 })
        res.status(200).json(docentesBDD)
    } catch (error) {
        res.status(500).json({ msg: `❌ Error en el servidor - ${error.message}` })
    }
}

const verDocente = async (req, res) => {
    try {
        const { id } = req.params
        const docenteBDD = await Docente.findById(id).select("-password -token -status -__v -createdAt -updatedAt")
        if (!docenteBDD) return res.status(404).json({ msg: "El docente no existe" })
        res.status(200).json(docenteBDD)
    } catch (error) {
        res.status(500).json({ msg: `❌ Error en el servidor - ${error.message}` })
    }
}

const buscarDocente = async (req, res) => {
    try {
        const { email } = req.query;
        if (!email) return res.status(400).json({ msg: "Debes proporcionar un correo electrónico" });
        const docenteBDD = await Docente.findOne({ email }).select("-password -token -__v -updatedAt -createdAt");
        if (!docenteBDD) return res.status(404).json({ msg: "No existe el docente" });
        res.status(200).json(docenteBDD);
    } catch (error) {
        res.status(500).json({ msg: `❌ Error en el servidor - ${error}` })
    }
}

const eliminarDocente = async (req, res) => {
    try {
        const { id } = req.params
        const docenteBDD = await Docente.findById(id)
        if (!docenteBDD) return res.status(404).json({ msg: "El docente no existe" })
        
        await docenteBDD.deleteOne()
        res.status(200).json({ msg: "Docente eliminado correctamente" })
    } catch (error) {
        res.status(500).json({ msg: `❌ Error en el servidor - ${error.message}` })
    }
}

// ==========================================
// OFICINAS
// ==========================================

const crearOficinas = async (req, res) => {
    try {
        const { numero, ubicacion, encargado, telefono, edificio, piso, coordenadas } = req.body
        if (!numero || !ubicacion || !edificio) return res.status(400).json({ msg: "Lo sentimos, debes llenar numero, ubicacion y edificio" })
        
        const nuevaOficina = new Oficina({ numero, ubicacion, encargado, telefono, edificio, piso, coordenadas })

        if (req.files?.subirImagenOficina) {
            const { secure_url } = await subirImagenOficina(req.files.subirImagenOficina.tempFilePath)
            nuevaOficina.imagen = secure_url
        }
        if (req.body.subirBase64Oficina) {
            const secure_url = await subirBase64Oficina(req.body.subirBase64Oficina)
            nuevaOficina.imagen = secure_url
        }

        await nuevaOficina.save()
        res.status(200).json({ msg: "Oficina creada correctamente", oficina: nuevaOficina })
    } catch (error) {
        res.status(500).json({ msg: `❌ Error en el servidor - ${error.message}` })
    }
}

const listarOficinas = async (req, res) => {
    try {
        const oficinasBDD = await Oficina.find().sort({ createdAt: -1 })
        res.status(200).json(oficinasBDD)
    } catch (error) {
        res.status(500).json({ msg: `❌ Error en el servidor - ${error.message}` })
    }
}

const verOficina = async (req, res) => {
    try {
        const { id } = req.params
        const oficinaBDD = await Oficina.findById(id)
        if (!oficinaBDD) return res.status(404).json({ msg: "La oficina no existe" })
        res.status(200).json(oficinaBDD)
    } catch (error) {
        res.status(500).json({ msg: `❌ Error en el servidor - ${error.message}` })
    }
}

const actualizarOficina = async (req, res) => {
    try {
        const { id } = req.params 
        const { numero, ubicacion, encargado, telefono, edificio, piso, coordenadas } = req.body
        
        if (Object.values(req.body).includes("")) return res.status(400).json({ msg: "Lo sentimos, debes llenar todos los campos" })
        
        const oficinaBDD = await Oficina.findById(id)
        if (!oficinaBDD) return res.status(404).json({ msg: "La oficina no existe" })
        
        oficinaBDD.numero = numero || oficinaBDD.numero
        oficinaBDD.ubicacion = ubicacion || oficinaBDD.ubicacion
        oficinaBDD.encargado = encargado || oficinaBDD.encargado
        oficinaBDD.telefono = telefono || oficinaBDD.telefono
        oficinaBDD.edificio = edificio || oficinaBDD.edificio
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
        res.status(200).json({ msg: "Oficina actualizada correctamente" })
    } catch (error) {
        res.status(500).json({ msg: `❌ Error en el servidor - ${error.message}` })
    }
}

const eliminarOficina = async (req, res) => {
    try {
        const { id } = req.params
        const oficinaBDD = await Oficina.findById(id)   
        if (!oficinaBDD) return res.status(404).json({ msg: "La oficina no existe" })
        
        await oficinaBDD.deleteOne()
        res.status(200).json({ msg: "Oficina eliminada correctamente" })
    } catch (error) {
        res.status(500).json({ msg: `❌ Error en el servidor - ${error.message}` })
    }
}

// ==========================================
// AULAS
// ==========================================

const crearAulas = async (req, res) => {
    try {
        const { numero, ubicacion, tipo, piso, coordenadas, edificio } = req.body
        if (!numero || !ubicacion || !tipo || !edificio) {
            return res.status(400).json({ msg: "Lo sentimos, debes llenar numero, ubicacion, tipo y edificio" })
        }
        
        const nuevaAula = new Aula({ numero, ubicacion, tipo, piso, coordenadas, edificio })

        if (req.files?.subirImagenAula) {
            const { secure_url } = await subirImagenAula(req.files.subirImagenAula.tempFilePath)
            nuevaAula.imagen = secure_url
        }
        if (req.body.subirBase64Aula) {
            const secure_url = await subirBase64Aula(req.body.subirBase64Aula)
            nuevaAula.imagen = secure_url
        }

        await nuevaAula.save()
        res.status(200).json({ msg: "Aula creada correctamente", aula: nuevaAula })
    } catch (error) {
        res.status(500).json({ msg: `❌ Error en el servidor - ${error.message}` })
    }
}

const actualizarAula = async (req, res) => {
    try {
        const { id } = req.params
        const { numero, ubicacion, tipo, piso, coordenadas, edificio } = req.body
        
        if (Object.values(req.body).includes("")) return res.status(400).json({ msg: "Lo sentimos, debes llenar todos los campos" })
        
        const aulaBDD = await Aula.findById(id)
        if (!aulaBDD) return res.status(404).json({ msg: "El aula no existe" })
        
        aulaBDD.numero = numero || aulaBDD.numero
        aulaBDD.ubicacion = ubicacion || aulaBDD.ubicacion
        aulaBDD.tipo = tipo || aulaBDD.tipo
        aulaBDD.piso = piso || aulaBDD.piso
        aulaBDD.coordenadas = coordenadas || aulaBDD.coordenadas
        aulaBDD.edificio = edificio || aulaBDD.edificio

        if (req.files?.subirImagenAula) {
            const { secure_url } = await subirImagenAula(req.files.subirImagenAula.tempFilePath)
            aulaBDD.imagen = secure_url
        }
        if (req.body.subirBase64Aula) {
            const secure_url = await subirBase64Aula(req.body.subirBase64Aula)
            aulaBDD.imagen = secure_url
        }

        await aulaBDD.save()
        res.status(200).json({ msg: "Aula actualizada correctamente" })
    } catch (error) {
        res.status(500).json({ msg: `❌ Error en el servidor - ${error.message}` })
    }
}

const listarAulas = async (req, res) => {
    try {
        const aulasBDD = await Aula.find().populate('edificio', 'nombre codigo').sort({ createdAt: -1 })
        res.status(200).json(aulasBDD)
    } catch (error) {
        res.status(500).json({ msg: `❌ Error en el servidor - ${error.message}` })
    }
}

const verAula = async (req, res) => {
    try {
        const { id } = req.params
        const aulaBDD = await Aula.findById(id).populate('edificio', 'nombre codigo')
        if (!aulaBDD) return res.status(404).json({ msg: "El aula no existe" })
        res.status(200).json(aulaBDD)
    } catch (error) {
        res.status(500).json({ msg: `❌ Error en el servidor - ${error.message}` })
    }
}

const eliminarAula = async (req, res) => {
    try {
        const { id } = req.params
        const aulaBDD = await Aula.findById(id)
        if (!aulaBDD) return res.status(404).json({ msg: "El aula no existe" })
        
        await aulaBDD.deleteOne()
        res.status(200).json({ msg: "Aula eliminada correctamente" })
    } catch (error) {
        res.status(500).json({ msg: `❌ Error en el servidor - ${error.message}` })
    }
}

// ==========================================
// ESTUDIANTES
// ==========================================

const listarEstudiantes = async (req, res) => {
    try {
        const estudiantesBDD = await Estudiante.find().sort({ createdAt: -1 })
        res.status(200).json(estudiantesBDD)
    } catch (error) {
        res.status(500).json({ msg: `❌ Error en el servidor - ${error.message}` })
    }
}

const verEstudiante = async (req, res) => {
    try {
        const { id } = req.params
        const estudianteBDD = await Estudiante.findById(id)
        if (!estudianteBDD) return res.status(404).json({ msg: "El estudiante no existe" })
        res.status(200).json(estudianteBDD)
    } catch (error) {
        res.status(500).json({ msg: `❌ Error en el servidor - ${error.message}` })
    }
}

const buscarEstudiante = async (req, res) => {
    try {
        const { email } = req.query;
        if (!email) return res.status(400).json({ msg: "Debes proporcionar un correo electrónico" });
        const estudianteBDD = await Estudiante.findOne({ email }).select("-password -token -__v -updatedAt -createdAt");
        if (!estudianteBDD) return res.status(404).json({ msg: "No existe el estudiante" });
        res.status(200).json(estudianteBDD);
    } catch (error) {
        res.status(500).json({ msg: `❌ Error en el servidor - ${error}` })
    }
}

const eliminarEstudiante = async (req, res) => {
    try {
        const { id } = req.params
        const estudianteBDD = await Estudiante.findById(id)
        if (!estudianteBDD) return res.status(404).json({ msg: "El estudiante no existe" })
        
        await estudianteBDD.deleteOne()
        res.status(200).json({ msg: "Estudiante eliminado correctamente" })
    } catch (error) {
        res.status(500).json({ msg: `❌ Error en el servidor - ${error.message}` })
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
    listarEventos,
    verEvento,
    listarDocentes,
    verDocente,
    buscarDocente,
    eliminarDocente,
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
    eliminarEstudiante
}