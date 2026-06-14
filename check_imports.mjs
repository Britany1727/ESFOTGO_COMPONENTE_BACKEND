process.env.JWT_SECRET = 'test';
process.env.JWT_REFRESH_SECRET = 'test';
process.env.MONGODB_URI_PRODUCTION = 'mongodb://localhost:27017/test';
process.env.CLOUDINARY_CLOUD_NAME = 'test';
process.env.CLOUDINARY_API_KEY = 'test';
process.env.CLOUDINARY_API_SECRET = 'test';
process.env.USER_MAILTRAP = 'test';
process.env.PASS_MAILTRAP = 'test';

async function check() {
  const mods = [
    './src/server.js',
    './src/config/resend.js',
    './src/config/nodemailer.js',
    './src/middlewares/JWT.js',
    './src/middlewares/validators.js',
    './src/helpers/response.js',
    './src/helpers/sendMail.js',
    './src/helpers/uploadCloudinary.js',
    './src/routers/Admin_routes.js',
    './src/routers/Docente_routes.js',
    './src/routers/Estudiante_routes.js',
    './src/routers/Mapa_routes.js',
    './src/routers/Auth_routes.js',
    './src/routers/Tutoria_routes.js',
    './src/routers/Bus_routes.js',
    './src/controllers/admin_controllers.js',
    './src/controllers/docente_controllers.js',
    './src/controllers/estudiante_controllers.js',
    './src/controllers/mapa_controllers.js',
    './src/controllers/auth_controllers.js',
    './src/controllers/upload_controllers.js',
    './src/controllers/ubicacion_controllers.js',
    './src/controllers/grafo_controllers.js'
  ];
  for (const m of mods) {
    try {
      await import(m);
      console.log('OK:', m);
    } catch(e) {
      console.log('FAIL:', m, '->', e.message);
    }
  }
}
check();
