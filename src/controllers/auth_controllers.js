import Admin from "../models/Admin.js"
import Docente from "../models/Docente.js"
import Estudiante from "../models/Estudiante.js"
import RefreshToken from "../models/RefreshToken.js"
import { crearTokenJWT, crearRefreshTokenJWT, guardarRefreshToken } from "../middlewares/JWT.js"
import { successResponse, errorResponse } from "../helpers/response.js"
import { sendMailToRecoveryPassword } from "../helpers/sendMail.js"
import jwt from "jsonwebtoken"
import mongoose from "mongoose"

const REFRESH_TOKEN_EXPIRY_DAYS = 7

const generarRefreshToken = (userId, userType) => {
  return jwt.sign({ id: userId, type: userType }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: `${REFRESH_TOKEN_EXPIRY_DAYS}d`
  })
}

export const refreshToken = async (req, res) => {
  try {
    const { refreshToken: token } = req.body
    if (!token) {
      return errorResponse(res, "Refresh token requerido", 401)
    }

    const storedToken = await RefreshToken.findOne({ token })
    if (!storedToken) {
      return errorResponse(res, "Refresh token inválido o expirado", 401)
    }

    let decoded
    try {
      decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET)
    } catch (err) {
      await RefreshToken.deleteOne({ token })
      return errorResponse(res, "Refresh token inválido o expirado", 401)
    }

    const { id, type } = decoded
    const Modelo = type === 'admin' ? Admin : type === 'docente' ? Docente : Estudiante
    const user = await Modelo.findById(id).select("-password -token")
    if (!user) {
      await RefreshToken.deleteOne({ token })
      return errorResponse(res, "Usuario no encontrado", 401)
    }

    const newAccessToken = crearTokenJWT(user._id, user.rol)
    const newRefreshToken = generarRefreshToken(user._id, type)

    storedToken.token = newRefreshToken
    storedToken.expires_at = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000)
    await storedToken.save()

    return successResponse(res, {
      token: newAccessToken,
      refreshToken: newRefreshToken,
      _id: user._id,
      rol: user.rol
    }, "Token renovado exitosamente")
  } catch (error) {
    return errorResponse(res, error.message)
  }
}

export const reenviarVerificacion = async (req, res) => {
  try {
    const { email } = req.body
    if (!email) {
      return errorResponse(res, "Debes proporcionar un correo electrónico", 400)
    }

    const estudiante = await Estudiante.findOne({ email })
    if (!estudiante) {
      return errorResponse(res, "El correo no está registrado", 404)
    }

    if (estudiante.confirmEmail) {
      return errorResponse(res, "La cuenta ya está verificada", 400)
    }

    const token = estudiante.createToken()
    estudiante.token = token
    await estudiante.save()

    await sendMailToRecoveryPassword(email, token)
    return successResponse(res, null, "Correo de verificación reenviado exitosamente")
  } catch (error) {
    return errorResponse(res, error.message)
  }
}

export const cambiarPassword = async (req, res) => {
  try {
    const passwordactual = req.body.passwordactual || req.body.currentPassword
    const passwordnuevo = req.body.passwordnuevo || req.body.newPassword
    if (!passwordactual || !passwordnuevo) {
      return errorResponse(res, "Debes proporcionar password actual y nuevo password", 400)
    }

    const userHeader = req.userHeader || req.docenteHeader || req.adminHeader
    if (!userHeader) {
      return errorResponse(res, "Usuario no autenticado", 401)
    }

    let userBDD
    const rol = userHeader.rol
    if (rol === 'admin') {
      userBDD = await Admin.findById(userHeader._id)
    } else if (rol === 'docente') {
      userBDD = await Docente.findById(userHeader._id)
    } else {
      userBDD = await Estudiante.findById(userHeader._id)
    }

    if (!userBDD) {
      return errorResponse(res, "Usuario no encontrado", 404)
    }

    const verificarPassword = await userBDD.matchPassword(passwordactual)
    if (!verificarPassword) {
      return errorResponse(res, "El password actual no es correcto", 401)
    }

    userBDD.password = await userBDD.encryptPassword(passwordnuevo)
    await userBDD.save()

    return successResponse(res, null, "Password actualizado correctamente")
  } catch (error) {
    return errorResponse(res, error.message)
  }
}
