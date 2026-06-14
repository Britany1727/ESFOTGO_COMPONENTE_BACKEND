import dotenv from "dotenv";
dotenv.config();

import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    host: process.env.HOST_MAILTRAP,
    port: parseInt(process.env.PORT_MAILTRAP),
    secure: false,
    auth: {
        user: process.env.USER_MAILTRAP,
        pass: process.env.PASS_MAILTRAP,
    },
    tls: {
        rejectUnauthorized: false
    }
});

const sendMail = async (to, subject, html) => {
    try {
        const info = await transporter.sendMail({
            from: `"EsfotGo" <${process.env.USER_MAILTRAP}>`,
            to,
            subject,
            html,
        });

        console.log("✅ Email enviado:", info.messageId);

    } catch (error) {
        console.error("❌ Error enviando email:", error.message);
    }
};

export default sendMail;