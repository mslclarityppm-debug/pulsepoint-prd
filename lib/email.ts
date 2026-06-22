// Utilidad para envío de emails usando nodemailer.
// Server-only para evitar exposición en cliente.
import nodemailer from "nodemailer";
import "server-only";

import { env } from "@/lib/env";

// Only create transporter if email config is available
let transporter: nodemailer.Transporter | null = null;
if (env.EMAIL_SMTP_HOST && env.EMAIL_SMTP_USER && env.EMAIL_SMTP_PASS && env.EMAIL_FROM) {
  transporter = nodemailer.createTransport({
    host: env.EMAIL_SMTP_HOST,
    port: env.EMAIL_SMTP_PORT,
    secure: env.EMAIL_SMTP_PORT === 465, // true for 465, false for other ports
    auth: {
      user: env.EMAIL_SMTP_USER,
      pass: env.EMAIL_SMTP_PASS,
    },
    // Security hardening
    tls: {
      rejectUnauthorized: true,
      minVersion: 'TLSv1.2',
    },
  });
}

// Sanitiza una URL para evitar inyección en emails (XSS en clientes de email)
function sanitizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    // Solo permitir protocolos http y https
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return '#';
    }
    return url;
  } catch {
    return '#';
  }
}

// Escapa texto HTML para prevenir inyección
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m] || m);
}

export async function sendPasswordResetEmail(email: string, resetToken: string): Promise<void> {
  if (!transporter || !env.EMAIL_FROM) {
    throw new Error("Email service not configured");
  }

  const baseUrl = env.APP_URL || 'http://localhost:3000';
  const resetUrl = `${baseUrl}/reset-password?token=${encodeURIComponent(resetToken)}`;
  const safeResetUrl = sanitizeUrl(resetUrl);
  const safeEmail = escapeHtml(email);

  const mailOptions = {
    from: env.EMAIL_FROM,
    to: safeEmail,
    subject: "Restablece tu contraseña - Pulse Point",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333;">Restablece tu contraseña</h2>
        <p>Hemos recibido una solicitud para restablecer tu contraseña en Pulse Point.</p>
        <p>Si no solicitaste este cambio, puedes ignorar este email.</p>
        <p>Para restablecer tu contraseña, haz clic en el siguiente enlace:</p>
        <a href="${safeResetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Restablecer contraseña</a>
        <p style="margin-top: 20px;">Este enlace expirará en 1 hora por seguridad.</p>
        <p>Si el botón no funciona, copia y pega esta URL en tu navegador:</p>
        <p style="word-break: break-all; color: #666;">${safeResetUrl}</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">Pulse Point - Salud preventiva cardiovascular</p>
      </div>
    `,
    text: `
      Restablece tu contraseña - Pulse Point

      Hemos recibido una solicitud para restablecer tu contraseña.

      Si no solicitaste este cambio, puedes ignorar este email.

      Para restablecer tu contraseña, visita: ${resetUrl}

      Este enlace expirará en 1 hora por seguridad.
    `,
  };

  await transporter.sendMail(mailOptions);
}