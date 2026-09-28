// Envío de mails. Con SMTP_USER/SMTP_PASS en el .env manda de verdad (Gmail
// por defecto); sin eso, en desarrollo imprime el mail en la consola.
const nodemailer = require('nodemailer');

const transporte = process.env.SMTP_USER
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT) || 465,
      secure: (Number(process.env.SMTP_PORT) || 465) === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    })
  : null;

async function enviarMail({ para, asunto, texto }) {
  if (!transporte) {
    if (process.env.NODE_ENV === 'production') throw new Error('Falta configurar SMTP_USER/SMTP_PASS');
    console.log(`\n[mail sin SMTP] Para: ${para}\nAsunto: ${asunto}\n${texto}\n`);
    return;
  }
  await transporte.sendMail({ from: `Maply Services <${process.env.SMTP_USER}>`, to: para, subject: asunto, text: texto });
}

module.exports = { enviarMail };
