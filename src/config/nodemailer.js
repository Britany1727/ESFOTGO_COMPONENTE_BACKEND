import dotenv from "dotenv";
dotenv.config();
import axios from "axios";
import fs from "fs";
import path from "path";

const ENV_PATH = path.resolve(process.cwd(), ".env");

const GRAPH_SCOPE = "https://graph.microsoft.com/Mail.Send offline_access";

let cachedToken = null;
let tokenExpiry = 0;

const updateStoredRefreshToken = (newRefreshToken) => {
    try {
        let envContent = fs.readFileSync(ENV_PATH, "utf-8");

        if (envContent.includes("OUTLOOK_REFRESH_TOKEN=")) {
            envContent = envContent.replace(
                /OUTLOOK_REFRESH_TOKEN=.*/,
                `OUTLOOK_REFRESH_TOKEN=${newRefreshToken}`
            );
        } else {
            envContent += `\nOUTLOOK_REFRESH_TOKEN=${newRefreshToken}\n`;
        }

        fs.writeFileSync(ENV_PATH, envContent, "utf-8");
        process.env.OUTLOOK_REFRESH_TOKEN = newRefreshToken;
    } catch (error) {
        console.error("No se pudo persistir el refresh token nuevo:", error.message);
    }
};

const getAccessToken = async () => {
    if (cachedToken && Date.now() < tokenExpiry) {
        return cachedToken;
    }

    const params = new URLSearchParams({
        client_id: process.env.OUTLOOK_CLIENT_ID,
        client_secret: process.env.OUTLOOK_CLIENT_SECRET,
        refresh_token: process.env.OUTLOOK_REFRESH_TOKEN,
        grant_type: "refresh_token",
        scope: GRAPH_SCOPE,
    });

    let data;
    try {
        const response = await axios.post(
            "https://login.microsoftonline.com/common/oauth2/v2.0/token",
            params.toString(),
            { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
        );
        data = response.data;
    } catch (error) {
        console.error("Error obteniendo token de Microsoft:", error.response?.data || error.message);
        throw error;
    }

    if (data.refresh_token && data.refresh_token !== process.env.OUTLOOK_REFRESH_TOKEN) {
        updateStoredRefreshToken(data.refresh_token);
    }

    cachedToken = data.access_token;
    tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;

    return cachedToken;
};

const sendMail = async (to, subject, html) => {
    try {
        const accessToken = await getAccessToken();

        const payload = {
            message: {
                subject,
                body: {
                    contentType: "HTML",
                    content: html,
                },
                toRecipients: [
                    {
                        emailAddress: {
                            address: to,
                        },
                    },
                ],
            },
        };

        await axios.post(
            "https://graph.microsoft.com/v1.0/me/sendMail",
            payload,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
            }
        );

        console.log("Email enviado correctamente via Graph API");
        return true;
    } catch (error) {
        console.error("Error enviando email:", error.response?.data || error.message);
        return false;
    }
};

export default sendMail;
