import dotenv from "dotenv";
dotenv.config();
import nodemailer from "nodemailer";
import axios from "axios";

// Función para obtener un Access Token fresco
const getAccessToken = async () => {
    const params = new URLSearchParams({
        client_id: process.env.OUTLOOK_CLIENT_ID,
        client_secret: process.env.OUTLOOK_CLIENT_SECRET,
        refresh_token: process.env.OUTLOOK_REFRESH_TOKEN,
        grant_type: "refresh_token",
        scope: "https://graph.microsoft.com/Mail.Send offline_access",
    });

    const { data } = await axios.post(
        "https://login.microsoftonline.com/common/oauth2/v2.0/token",
        params.toString(),
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    return data.access_token;
};

const sendMail = async (to, subject, html) => {
    try {
        const accessToken = await getAccessToken();

        const transporter = nodemailer.createTransport({
            host: "smtp-mail.outlook.com",
            port: 587,
            secure: false,
            auth: {
                type: "OAuth2",
                user: process.env.OUTLOOK_USER,
                accessToken,
            },
            tls: { rejectUnauthorized: false },
        });

        const info = await transporter.sendMail({
            from: `"EsfotGo" <${process.env.OUTLOOK_USER}>`,
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