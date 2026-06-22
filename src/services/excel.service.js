import XLSX from 'xlsx';
import Docente from '../models/Docente.js';
import Estudiante from '../models/Estudiante.js';

const processExcel = async (filePath, tipo) => {
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  const headerRowIndex = rows.findIndex(row =>
    row.some(cell => String(cell).toUpperCase() === 'NOMBRE')
  );

  if (headerRowIndex === -1) throw new Error('No se encontró columna NOMBRE en el Excel');

  const headers = rows[headerRowIndex].map(h => String(h).toUpperCase().trim());
  const dataRows = rows.slice(headerRowIndex + 1);

  const iNombre = headers.indexOf('NOMBRE');
  const iCorreo = (() => {
  const prioridad = ['EMAILEPN', 'CORREO INSTITUCIONAL', 'CORREO', 'EMAIL'];
  for (const nombre of prioridad) {
    const i = headers.findIndex(h => h === nombre);
    if (i !== -1) return i;
  }
  const iCarrera = headers.findIndex(h => h.includes('CARRERA'));
  if (iCarrera !== -1) return iCarrera;
  return -1;
})();
  const Modelo = tipo === 'docente' ? Docente : Estudiante;
  const hashedPassword = null;

  const errores = [];
  const guardados = [];

  for (const [index, row] of dataRows.entries()) {
    const fila = headerRowIndex + index + 2;

    const nombreCompleto = row[iNombre] ? String(row[iNombre]).trim() : null;
    const correo = row[iCorreo] ? String(row[iCorreo]).trim().toLowerCase() : null;

    if (!nombreCompleto) {
      errores.push({ fila, mensaje: 'Nombre vacío, fila ignorada' });
      continue;
    }

    if (!correo || !correo.endsWith('@epn.edu.ec')) {
      errores.push({ fila, mensaje: 'Correo no institucional (debe ser @epn.edu.ec), fila ignorada' });
      continue;
    }

    const partes = nombreCompleto.split(/\s+/).filter(p => p.length > 0);

    let apellido, nombre;
    if (partes.length === 1) {
      apellido = partes[0];
      nombre = '';
    } else if (partes.length === 2) {
      apellido = partes[0];
      nombre = partes[1];
    } else if (partes.length === 3) {
      apellido = partes.slice(0, 2).join(' ');
      nombre = partes[2];
    } else {
      apellido = partes.slice(0, 2).join(' ');
      nombre = partes.slice(2).join(' ');
    }

    const existe = await Modelo.findOne({ email: correo });
    if (existe) {
      errores.push({ fila, mensaje: `Correo ya existe: ${correo}` });
      continue;
    }

    const nuevoRegistro = {
      nombre,
      apellido,
      email: correo,
      password: hashedPassword,
      status: true
    };

    if (tipo === 'docente') {
      nuevoRegistro.telefono = '0000000000';
    }

    try {
      await Modelo.create(nuevoRegistro);
      guardados.push({ nombre, apellido, email: correo });
    } catch (err) {
      if (err.code === 11000) {
        errores.push({ fila, mensaje: `Correo duplicado: ${correo}` });
      } else {
        throw err;
      }
    }
  }

  return {
    tipo,
    totalFilas: dataRows.length,
    guardados: guardados.length,
    errores
  };
};

export { processExcel };