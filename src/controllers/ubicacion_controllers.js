import Ubicacion from "../models/Ubicacion.js"
import { successResponse, errorResponse } from "../helpers/response.js"
import { subirBase64Ubicacion } from "../helpers/uploadCloudinary.js"

export const listarUbicaciones = async (req, res) => {
  try {
    const ubicaciones = await Ubicacion.find().sort({ created_at: -1 })
    return successResponse(res, ubicaciones)
  } catch (error) {
    return errorResponse(res, error.message)
  }
}

export const listarUbicacionesPorCategoria = async (req, res) => {
  try {
    const { category } = req.params
    if (!category) {
      return errorResponse(res, "Debes proporcionar una categoría", 400)
    }
    const ubicaciones = await Ubicacion.find({
      categoria: { $regex: new RegExp(`^${category}$`, 'i') }
    }).sort({ created_at: -1 })
    return successResponse(res, ubicaciones)
  } catch (error) {
    return errorResponse(res, error.message)
  }
}

export const verUbicacion = async (req, res) => {
  try {
    const { id } = req.params
    const ubicacion = await Ubicacion.findById(id)
    if (!ubicacion) {
      return errorResponse(res, "La ubicación no existe", 404)
    }
    return successResponse(res, ubicacion)
  } catch (error) {
    return errorResponse(res, error.message)
  }
}

export const crearUbicacion = async (req, res) => {
  try {
    const { nombre, descripcion, categoria, latitud, longitud, imagen, imagen_360, image360, tipo_media, mediaType } = req.body
    if (!nombre || !categoria || latitud === undefined || longitud === undefined) {
      return errorResponse(res, "Debes proporcionar nombre, categoria, latitud y longitud", 400)
    }

    let imagenFinal = imagen || ''
    if (imagen && typeof imagen === 'string' && imagen.startsWith('data:')) {
      try {
        imagenFinal = await subirBase64Ubicacion(imagen)
      } catch (err) {
        console.error('Error al subir imagen a Cloudinary:', err.message)
      }
    }

    let imagen360Final = imagen_360 || image360 || ''
    if (imagen360Final && imagen360Final.startsWith('data:')) {
      try {
        imagen360Final = await subirBase64Ubicacion(imagen360Final)
      } catch (err) {
        console.error('Error al subir imagen 360 a Cloudinary:', err.message)
        imagen360Final = ''
      }
    }

    const tipoMediaFinal = tipo_media || mediaType || null

    const nuevaUbicacion = new Ubicacion({
      nombre, descripcion, categoria, latitud, longitud,
      imagen: imagenFinal,
      imagen_360: imagen360Final || undefined,
      tipo_media: tipoMediaFinal
    })
    await nuevaUbicacion.save()
    return successResponse(res, nuevaUbicacion, "Ubicación creada correctamente", 201)
  } catch (error) {
    return errorResponse(res, error.message)
  }
}

export const actualizarUbicacion = async (req, res) => {
  try {
    const { id } = req.params
    const { nombre, descripcion, categoria, latitud, longitud, imagen, imagen_360, image360, tipo_media, mediaType } = req.body

    const ubicacion = await Ubicacion.findById(id)
    if (!ubicacion) {
      return errorResponse(res, "La ubicación no existe", 404)
    }

    if (nombre !== undefined) ubicacion.nombre = nombre
    if (descripcion !== undefined) ubicacion.descripcion = descripcion
    if (categoria !== undefined) ubicacion.categoria = categoria
    if (latitud !== undefined) ubicacion.latitud = latitud
    if (longitud !== undefined) ubicacion.longitud = longitud

    if (imagen !== undefined) {
      if (typeof imagen === 'string' && imagen.startsWith('data:')) {
        try {
          ubicacion.imagen = await subirBase64Ubicacion(imagen)
        } catch (err) {
          console.error('Error al subir imagen a Cloudinary:', err.message)
        }
      } else {
        ubicacion.imagen = imagen
      }
    }

    const imagen360Value = imagen_360 !== undefined ? imagen_360 : image360
    if (imagen360Value !== undefined) {
      if (typeof imagen360Value === 'string' && imagen360Value.startsWith('data:')) {
        try {
          ubicacion.imagen_360 = await subirBase64Ubicacion(imagen360Value)
        } catch (err) {
          console.error('Error al subir imagen 360 a Cloudinary:', err.message)
        }
      } else {
        ubicacion.imagen_360 = imagen360Value
      }
    }

    if (tipo_media !== undefined) {
      ubicacion.tipo_media = tipo_media
    } else if (mediaType !== undefined) {
      ubicacion.tipo_media = mediaType
    }

    await ubicacion.save()
    return successResponse(res, ubicacion, "Ubicación actualizada correctamente")
  } catch (error) {
    return errorResponse(res, error.message)
  }
}

export const eliminarUbicacion = async (req, res) => {
  try {
    const { id } = req.params
    const ubicacion = await Ubicacion.findById(id)
    if (!ubicacion) {
      return errorResponse(res, "La ubicación no existe", 404)
    }
    await ubicacion.deleteOne()
    return successResponse(res, null, "Ubicación eliminada correctamente")
  } catch (error) {
    return errorResponse(res, error.message)
  }
}
