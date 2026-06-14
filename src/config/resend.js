import { Resend } from 'resend';

let resendInstance = null

const getResend = () => {
  if (!resendInstance && process.env.RESEND_API_KEY) {
    resendInstance = new Resend(process.env.RESEND_API_KEY)
  }
  return resendInstance
}

const sendMail = async (to, subject, html) => {
  const client = getResend()
  if (!client) {
    console.warn('Resend no configurado - usa nodemailer como fallback')
    return null
  }

  const { data, error } = await client.emails.send({
    from: 'EsfotGo <onboarding@resend.dev>',
    to,
    subject,
    html,
  })

  if (error) throw new Error(error.message)
  return data
}

export default sendMail;