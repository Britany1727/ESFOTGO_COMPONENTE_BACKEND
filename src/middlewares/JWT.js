import jwt from "jsonwebtoken"
import Docente from "../models/Docente.js"
import Admin from "../models/Admin.js"
import Estudiante from "../models/Estudiante.js"
import RefreshToken from "../models/RefreshToken.js"

const crearTokenJWT = (id, rol) => {
  return jwt.sign({ id, rol }, process.env.JWT_SECRET, { expiresIn: "15m" })
}

const crearRefreshTokenJWT = (id, rol) => {
  return jwt.sign({ id, rol }, process.env.JWT_REFRESH_SECRET, { expiresIn: "7d" })
}

const guardarRefreshToken = async (userId, userType, token) => {
  await RefreshToken.findOneAndDelete({ userId })
  const refreshToken = new RefreshToken({
    userId,
    userType,
    token,
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  })
  await refreshToken.save()
  return refreshToken
}

const verificarRolesPermitidos = (...rolesPermitidos) => {
  return (req, res, next) => {
    const usuario = req.adminHeader || req.docenteHeader || req.userHeader
    if (!usuario) {
      return res.status(401).json({ success: false, message: "Acceso denegado: no autenticado" })
    }
    if (!rolesPermitidos.includes(usuario.rol)) {
      return res.status(403).json({ success: false, message: "Acceso denegado: rol no autorizado" })
    }
    next()
  }
}

const verificarTokenJWT = async (req, res, next) => {
  const { authorization } = req.headers
  if (!authorization) {
    return res.status(401).json({ success: false, message: "Acceso denegado: token no proporcionado" })
  }

  try {
    const token = authorization.split(" ")[1]
    const { id, rol } = jwt.verify(token, process.env.JWT_SECRET)

    if (rol === "admin") {
      const adminBDD = await Admin.findById(id).lean().select("-password -token -__v")
      if (!adminBDD) return res.status(401).json({ success: false, message: "Admin no encontrado" })
      req.adminHeader = adminBDD
      next()
    } else if (rol === "docente") {
      const docenteBDD = await Docente.findById(id).lean().select("-password -token -__v")
      if (!docenteBDD) return res.status(401).json({ success: false, message: "Docente no encontrado" })
      req.docenteHeader = docenteBDD
      next()
    } else if (rol === "estudiante") {
      const estudianteBDD = await Estudiante.findById(id).lean().select("-password -token -__v")
      if (!estudianteBDD) return res.status(401).json({ success: false, message: "Estudiante no encontrado" })
      req.userHeader = estudianteBDD
      next()
    } else {
      return res.status(403).json({ success: false, message: "Rol no válido" })
    }
  } catch (error) {
    return res.status(401).json({ success: false, message: "Token inválido o expirado" })
  }
}

export {
  crearTokenJWT,
  crearRefreshTokenJWT,
  guardarRefreshToken,
  verificarTokenJWT,
  verificarRolesPermitidos
}