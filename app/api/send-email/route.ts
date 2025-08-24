// app/api/send-email/route.ts
export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
// @ts-ignore
const nodemailer = require('nodemailer')

type Attachment = {
  content: string
  filename: string
  type: string
}

export async function POST(req: Request) {
  const { to, subject, attachment } = (await req.json()) as {
    to: string
    subject: string
    attachment: Attachment
  }

  if (!to || !subject || !attachment) {
    return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 })
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER!,
        pass: process.env.SMTP_PASS!
      }
    })

    await transporter.sendMail({
      // Cambia aquí a tu remitente verificado en Brevo
      from: `"Estambul App" <sstambul40@gmail.com>`,
      to,
      subject,
      text: 'Adjunto encontrarás el reporte mensual.',
      attachments: [
        {
          filename: attachment.filename,
          content: attachment.content,
          encoding: attachment.type === 'text/csv' ? 'utf-8' : 'base64',
          contentType: attachment.type
        }
      ]
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Error enviando correo:', err)
    return NextResponse.json({ error: 'Error al enviar el correo' }, { status: 500 })
  }
}