import fs from "fs";
import path from "path";
import nodemailer from "nodemailer";
import { SITE } from "@/lib/constants";

const logPath = path.join(process.cwd(), "data", "emails.log");

type SendOptions = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

function isSmtpConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER);
}

function logEmail(opts: SendOptions): void {
  const dataDir = path.dirname(logPath);
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  const entry = `\n--- ${new Date().toISOString()} ---\nTo: ${opts.to}\nSubject: ${opts.subject}\n${opts.text || opts.html}\n`;
  fs.appendFileSync(logPath, entry, "utf-8");
}

export async function sendEmail(opts: SendOptions): Promise<boolean> {
  if (!opts.to) return false;

  if (!isSmtpConfigured()) {
    if (process.env.NODE_ENV === "production" && process.env.CFM_REQUIRE_SMTP === "true") {
      console.error(`[CFM Email] SMTP requis en production — email non envoyé à ${opts.to}`);
      return false;
    }
    logEmail(opts);
    console.log(`[CFM Email - mode fichier] → ${opts.to}: ${opts.subject}`);
    return true;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587", 10),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM || `${SITE.sigle} <${SITE.email}>`,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
    text: opts.text,
  });
  return true;
}

function baseTemplate(title: string, body: string): string {
  return `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#1a2f4a">
      <h2 style="color:#c9a227">${SITE.sigle} — ${title}</h2>
      ${body}
      <hr style="border:none;border-top:1px solid #eee;margin:24px 0" />
      <p style="font-size:12px;color:#666">${SITE.name} — ${SITE.country}</p>
    </div>
  `;
}

export async function sendRegistrationPendingEmail(to: string, firstName: string) {
  return sendEmail({
    to,
    subject: `${SITE.sigle} — Inscription reçue`,
    html: baseTemplate(
      "Inscription reçue",
      `<p>Bonjour ${firstName},</p>
       <p>Votre demande d'inscription a bien été enregistrée. Notre équipe validera votre compte sous peu.</p>
       <p>Vous recevrez un email dès que votre compte sera activé.</p>`
    ),
    text: `Bonjour ${firstName}, votre inscription CFM est en attente de validation.`,
  });
}

export async function sendAccountActivatedEmail(to: string, firstName: string) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return sendEmail({
    to,
    subject: `${SITE.sigle} — Compte activé`,
    html: baseTemplate(
      "Compte activé",
      `<p>Bonjour ${firstName},</p>
       <p>Votre compte membre CFM est maintenant <strong>actif</strong>.</p>
       <p><a href="${baseUrl}/membre/tableau-de-bord" style="color:#c9a227">Accéder à mon espace</a></p>`
    ),
  });
}

export async function sendHelpRequestReceivedEmail(to: string, firstName: string) {
  return sendEmail({
    to,
    subject: `${SITE.sigle} — Demande d'aide reçue`,
    html: baseTemplate(
      "Demande d'aide confidentielle",
      `<p>Bonjour ${firstName},</p>
       <p>Nous avons bien reçu votre demande d'aide. Notre équipe vous répondra sous <strong>7 jours ouvrés</strong>.</p>
       <p>Vos informations restent strictement confidentielles.</p>`
    ),
  });
}

export async function sendHelpRequestUpdateEmail(
  to: string,
  firstName: string,
  status: string,
  note: string
) {
  return sendEmail({
    to,
    subject: `${SITE.sigle} — Mise à jour de votre dossier`,
    html: baseTemplate(
      "Mise à jour dossier",
      `<p>Bonjour ${firstName},</p>
       <p>Statut de votre demande : <strong>${status}</strong></p>
       <p>${note}</p>`
    ),
  });
}

export async function sendDonationReceiptEmail(data: {
  to: string;
  donorName: string;
  amount: number;
  currency: string;
  provider: string;
  transactionId: string;
}) {
  return sendEmail({
    to: data.to,
    subject: `${SITE.sigle} — Reçu de don`,
    html: baseTemplate(
      "Reçu de don",
      `<p>Merci ${data.donorName} pour votre générosité envers les familles militaires.</p>
       <table style="width:100%;border-collapse:collapse;margin:16px 0">
         <tr><td style="padding:8px;border-bottom:1px solid #eee">Montant</td><td style="padding:8px;border-bottom:1px solid #eee"><strong>${data.amount} ${data.currency}</strong></td></tr>
         <tr><td style="padding:8px;border-bottom:1px solid #eee">Opérateur</td><td style="padding:8px;border-bottom:1px solid #eee">${data.provider}</td></tr>
         <tr><td style="padding:8px">Référence</td><td style="padding:8px">${data.transactionId}</td></tr>
       </table>
       <p>Ce don contribue au plaidoyer et à l'accompagnement des dépendants des militaires.</p>`
    ),
  });
}

export async function sendPasswordResetEmail(to: string, firstName: string, resetUrl: string) {
  return sendEmail({
    to,
    subject: `${SITE.sigle} — Réinitialisation mot de passe`,
    html: baseTemplate(
      "Réinitialisation",
      `<p>Bonjour ${firstName},</p>
       <p>Cliquez sur le lien ci-dessous pour réinitialiser votre mot de passe (valide 1 heure) :</p>
       <p><a href="${resetUrl}" style="color:#c9a227">${resetUrl}</a></p>
       <p>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p>`
    ),
  });
}
