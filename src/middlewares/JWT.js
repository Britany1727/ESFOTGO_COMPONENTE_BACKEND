import jwt from "jsonwebtoken"
import Docente from "../models/Docente.js"
import Admin from "../models/Admin.js"
import User from "../models/Estudiante.js"

const crearTokenJWT = (id, rol) => {
    return jwt.sign({ id, rol }, process.env.JWT_SECRET, { expiresIn: "1d" })
}

const verificarTokenJWT = async (req, res, next) => {
    const { authorization } = req.headers
    if (!authorization) return res.status(401).json({ msg: "Acceso denegado: token no proporcionado" })
    
    try {
        const token = authorization.split(" ")[1]
        const { id, rol } = jwt.verify(token, process.env.JWT_SECRET)
        
        if (rol === "admin") {
            const adminBDD = await Admin.findById(id).lean().select("-password")
            if (!adminBDD) return res.status(401).json({ msg: "Admin no encontrado" })
            req.adminHeader = adminBDD
            next()
        } else if (rol === "docente") {
            const docenteBDD = await Docente.findById(id).lean().select("-password")
            if (!docenteBDD) return res.status(401).json({ msg: "Docente no encontrado" })
            req.docenteHeader = docenteBDD
            next()
        } else if (rol === "user") {
            const userBDD = await User.findById(id).lean().select("-password")
            if (!userBDD) return res.status(401).json({ msg: "Usuario no encontrado" })
            req.userHeader = userBDD
            next()
        } else {
            return res.status(403).json({ msg: "Rol no válido" })
        }
    } catch (error) {
        return res.status(401).json({ msg: "Token inválido o expirado" })
    }
}

export { 
    crearTokenJWT,
    verificarTokenJWT 
}