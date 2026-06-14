export const successResponse = (res, data, message = "Operación exitosa", statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    data,
    message
  })
}

export const errorResponse = (res, message = "Error interno del servidor", statusCode = 500, errors = null) => {
  const response = {
    success: false,
    message
  }
  if (errors) {
    response.errors = errors
  }
  return res.status(statusCode).json(response)
}
