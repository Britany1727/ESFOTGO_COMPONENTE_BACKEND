import { errorResponse } from "../helpers/response.js"

export const validarEmailEstudiante = (email) => {
  if (!email) return 'El email es requerido'
  const normalized = email.toLowerCase().trim()
  if (!normalized.endsWith('@epn.edu.ec')) {
    return 'El correo debe ser institucional @epn.edu.ec'
  }
  if (normalized.includes('+')) {
    return 'El correo no puede contener alias (+)'
  }
  return null
}

export const validarPassword = (password) => {
  if (!password) return 'La contraseña es requerida'
  if (password.length < 12) return 'La contraseña debe tener al menos 12 caracteres'
  if (password.length > 128) return 'La contraseña no puede exceder 128 caracteres'
  if (!/[A-Z]/.test(password)) return 'La contraseña debe contener al menos una mayúscula'
  if (!/[a-z]/.test(password)) return 'La contraseña debe contener al menos una minúscula'
  if (!/[0-9]/.test(password)) return 'La contraseña debe contener al menos un número'
  return null
}

export const validarRegistroEstudiante = (body) => {
  const errors = []
  const { nombre, apellido, telefono, acceptTerms, email, password } = body

  if (!nombre || nombre.trim().length < 3 || nombre.trim().length > 100) {
    errors.push('El nombre debe tener entre 3 y 100 caracteres')
  }
  if (!apellido || apellido.trim().length < 1 || apellido.trim().length > 100) {
    errors.push('El apellido debe tener entre 1 y 100 caracteres')
  }
  if (telefono && !/^[0-9]{10}$/.test(telefono)) {
    errors.push('El teléfono debe tener exactamente 10 dígitos')
  }
  if (acceptTerms !== true) {
    errors.push('Debes aceptar los términos y condiciones')
  }

  const emailError = validarEmailEstudiante(email)
  if (emailError) errors.push(emailError)

  const passwordError = validarPassword(password)
  if (passwordError) errors.push(passwordError)

  return errors
}

export const validarRegistroDocente = (body) => {
  const errors = []
  const { nombre, apellido, telefono, password } = body

  if (!nombre || nombre.trim().length < 3 || nombre.trim().length > 100) {
    errors.push('El nombre debe tener entre 3 y 100 caracteres')
  }
  if (!apellido || apellido.trim().length < 1 || apellido.trim().length > 100) {
    errors.push('El apellido debe tener entre 1 y 100 caracteres')
  }
  if (telefono && !/^[0-9]{10}$/.test(telefono)) {
    errors.push('El teléfono debe tener exactamente 10 dígitos')
  }

  const passwordError = validarPassword(password)
  if (passwordError) errors.push(passwordError)

  return errors
}

export const validarEvento = (body) => {
  const errors = []
  const { nombre, informacion, ubicacion } = body

  if (!nombre || nombre.trim().length < 3 || nombre.trim().length > 150) {
    errors.push('El título debe tener entre 3 y 150 caracteres')
  }
  if (!informacion || informacion.trim().length < 10 || informacion.trim().length > 2000) {
    errors.push('La descripción debe tener entre 10 y 2000 caracteres')
  }
  if (ubicacion && (ubicacion.trim().length < 3 || ubicacion.trim().length > 200)) {
    errors.push('La ubicación debe tener entre 3 y 200 caracteres')
  }

  return errors
}

export const validarAula = (body) => {
  const errors = []
  const { nombre, ubicacion, estado } = body

  if (!nombre || nombre.trim().length < 3 || nombre.trim().length > 100) {
    errors.push('El nombre debe tener entre 3 y 100 caracteres')
  }
  if (!ubicacion || ubicacion.trim().length < 2 || ubicacion.trim().length > 150) {
    errors.push('La ubicación debe tener entre 2 y 150 caracteres')
  }
  if (estado && !['disponible', 'ocupado', 'mantenimiento'].includes(estado)) {
    errors.push('El estado debe ser: disponible, ocupado o mantenimiento')
  }

  return errors
}

export const validarMiddleware = (validator) => {
  return (req, res, next) => {
    const errors = validator(req.body)
    if (errors.length > 0) {
      return errorResponse(res, 'Error de validación', 400, errors)
    }
    next()
  }
}
