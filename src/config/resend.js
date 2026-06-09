import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const sendMail = async (to, subject, html) => {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { data, error } = await resend.emails.send({
        from: 'EsfotGo <onboarding@resend.dev>', // dominio gratuito de resend
        to,
        subject,
        html,
    });

    if (error) throw new Error(error.message);
    return data;
};

export default sendMail;