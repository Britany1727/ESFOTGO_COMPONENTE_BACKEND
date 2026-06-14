import { processExcel } from '../services/excel.service.js';
import path from 'path';

export const uploadExcel = async (req, res) => {
  try {
    if (!req.files || !req.files.file) {
      return res.status(400).json({ message: 'No se subió ningún archivo' });
    }

    // tipo viene en el body: "docente" o "estudiante"
    const tipo = req.body.tipo;
    if (!tipo || !['docente', 'estudiante'].includes(tipo)) {
      return res.status(400).json({ message: 'El campo "tipo" debe ser "docente" o "estudiante"' });
    }

    const archivo = req.files.file;
    const ext = path.extname(archivo.name).toLowerCase();

    if (ext !== '.xlsx' && ext !== '.xls') {
      return res.status(400).json({ message: 'Solo se permiten archivos Excel (.xlsx, .xls)' });
    }

    const uploadPath = `src/uploads/${Date.now()}_${archivo.name}`;
    await archivo.mv(uploadPath);

    const resultado = await processExcel(uploadPath, tipo);

    return res.json({
      ok: true,
      message: `Proceso completado: ${resultado.guardados} registros guardados${resultado.errores.length > 0 ? `, ${resultado.errores.length} ignorados` : ''}`,
      ...resultado
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message || 'Error procesando archivo' });
  }
};