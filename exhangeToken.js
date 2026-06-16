import "dotenv/config";
import axios from "axios";

const params = new URLSearchParams({
    client_id: process.env.OUTLOOK_CLIENT_ID,
    client_secret: process.env.OUTLOOK_CLIENT_SECRET,
    redirect_uri: "http://localhost:3001/callback",
    grant_type: "authorization_code",
    scope: "https://graph.microsoft.com/Mail.Send offline_access",
});

const code = process.argv[2];
if (!code) {
    console.error("Uso: node exhangeToken.js <authorization_code>");
    process.exit(1);
}
params.set("code", code);

const { data } = await axios.post(
    "https://login.microsoftonline.com/common/oauth2/v2.0/token",
    params.toString(),
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
);

console.log("✅ REFRESH TOKEN:", data.refresh_token);