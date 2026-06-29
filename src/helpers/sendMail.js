import sendMail from "../config/nodemailer.js"

const sendMailToRecoveryPassword = (userMail, token) => {

    return sendMail(

        userMail,
        " 🔒Restablece tu contraseña🔒",
        `
            <h1>Restablece tu contraseña</h1>
            <p>Hola, haz clic en el siguiente enlace para restablecer tu contraseña:</p>
            <a href="${process.env.URL_FRONTEND}recuperarpassword/${token}">

            Restablecer contraseña
            </a>
            <hr>
            <footer>El equipo de EsfotGo te da la más cordial bienvenida.</footer>
        `
    )
}

// Agregamos 'token' y 'password' a los parámetros
const sendMailToAdmin = (userMail, token, password) => {
    return sendMail(
        userMail,
        "🗺️📍🦉 Bienvenido estimado Administrador de ESFOT-GO 🗺️📍🦉",
        `
            <h1>ESFOT-GO</h1>
            <p>Bienvenido a ESFOT-GO, estas son tus credenciales de acceso:</p>
            <p><strong>Email:</strong> ${userMail}</p>
            <p><strong>Contraseña:</strong> ${password}</p>
            <br>
            <p>Primero, debes confirmar tu cuenta haciendo clic aquí:</p>
            <a href="${process.env.URL_FRONTEND}confirmar/${token}">Confirmar Cuenta</a>
            <hr>
            <footer>El equipo de ESFOT-GO te da la más cordial bienvenida.</footer>
        `
    )
}

const sendMailNotificationInscripcionDocente = (docenteMail, estudianteNombre, tutoriaTitulo, tutoriaId) => {
    return sendMail(
        docenteMail,
        "📚 Nueva inscripción en tu tutoría",
        `
            <h1>Nueva inscripción pendiente</h1>
            <p>El estudiante <strong>${estudianteNombre}</strong> se ha inscrito en tu tutoría:</p>
            <p><strong>${tutoriaTitulo || 'Sin título'}</strong></p>
            <br>
            <p>Ingresa al sistema para aceptar o rechazar esta inscripción.</p>
            <a href="${process.env.URL_FRONTEND}docente/tutorias/${tutoriaId}" 
               style="display:inline-block;padding:12px 24px;background:#4F46E5;color:white;text-decoration:none;border-radius:6px;">
                Ver inscripciones
            </a>
            <hr>
            <footer>El equipo de ESFOT-GO</footer>
        `
    )
}

const sendMailNotificationInscripcionEstudianteAceptada = (estudianteMail, estudianteNombre, tutoriaTitulo) => {
    return sendMail(
        estudianteMail,
        "✅ Inscripción ACEPTADA",
        `
            <h1>Inscripción aceptada</h1>
            <p>Hola <strong>${estudianteNombre}</strong>,</p>
            <p>Tu inscripción en la tutoría <strong>${tutoriaTitulo || 'Sin título'}</strong> ha sido <strong>ACEPTADA</strong>.</p>
            <br>
            <p>Revisa los detalles de la tutoría en la aplicación.</p>
            <hr>
            <footer>El equipo de ESFOT-GO</footer>
        `
    )
}

const sendMailNotificationInscripcionEstudianteRechazada = (estudianteMail, estudianteNombre, tutoriaTitulo) => {
    return sendMail(
        estudianteMail,
        "❌ Inscripción RECHAZADA",
        `
            <h1>Inscripción rechazada</h1>
            <p>Hola <strong>${estudianteNombre}</strong>,</p>
            <p>Lamentamos informarte que tu inscripción en la tutoría <strong>${tutoriaTitulo || 'Sin título'}</strong> ha sido <strong>RECHAZADA</strong>.</p>
            <br>
            <p>Ponte en contacto con el docente para más información.</p>
            <hr>
            <footer>El equipo de ESFOT-GO</footer>
        `
    )
}

export {
    sendMailToRecoveryPassword,
    sendMailToAdmin,
    sendMailNotificationInscripcionDocente,
    sendMailNotificationInscripcionEstudianteAceptada,
    sendMailNotificationInscripcionEstudianteRechazada
}