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

export {
    sendMailToRecoveryPassword,
    sendMailToAdmin
}