import nodemailer from 'nodemailer';
import { config } from '../config';
import { logger } from './logger';

const transporter = nodemailer.createTransport({
  host: config.smtp.host,
  port: config.smtp.port,
  secure: config.smtp.port === 465,
  auth: config.smtp.user ? {
    user: config.smtp.user,
    pass: config.smtp.password,
  } : undefined,
});

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail({ to, subject, html, text }: SendEmailOptions) {
  try {
    if (!config.smtp.user && config.nodeEnv !== 'production') {
      logger.info(`[MOCK EMAIL SENT] To: ${to} | Subject: ${subject}`);
      logger.debug(`[EMAIL BODY]: ${text || html.slice(0, 150)}...`);
      return { messageId: `mock-${Date.now()}` };
    }

    const info = await transporter.sendMail({
      from: config.smtp.from,
      to,
      subject,
      text: text || html.replace(/<[^>]+>/g, ''),
      html,
    });

    logger.info(`Email sent to ${to}: ${info.messageId}`);
    return info;
  } catch (error: any) {
    logger.error(`Error sending email to ${to}:`, { error: error.message });
    // In dev, don't break the flow if SMTP fails
    if (config.nodeEnv !== 'production') {
      return { messageId: `mock-fallback-${Date.now()}` };
    }
    throw error;
  }
}

// Email Templates
export const emailTemplates = {
  welcome: (name: string, orgName: string) => ({
    subject: `Welcome to ClientFlow, ${name}!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1e293b;">
        <h2 style="color: #4f46e5;">Welcome to ClientFlow!</h2>
        <p>Hi ${name},</p>
        <p>Congratulations on setting up your CRM workspace for <strong>${orgName}</strong>.</p>
        <p>With ClientFlow, you can manage leads, track customer deals across visual pipelines, coordinate tasks with your team, and accelerate your sales cycle.</p>
        <p><a href="${config.frontendUrl}/dashboard" style="display: inline-block; padding: 12px 24px; background-color: #4f46e5; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 12px;">Go to Dashboard</a></p>
        <p style="margin-top: 32px; font-size: 12px; color: #64748b;">The ClientFlow Team</p>
      </div>
    `,
  }),

  verifyEmail: (name: string, verifyUrl: string) => ({
    subject: 'Verify your ClientFlow email address',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1e293b;">
        <h2 style="color: #4f46e5;">Verify Your Email</h2>
        <p>Hi ${name},</p>
        <p>Please confirm your email address by clicking the button below:</p>
        <p><a href="${verifyUrl}" style="display: inline-block; padding: 12px 24px; background-color: #4f46e5; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 12px;">Verify Email</a></p>
        <p style="color: #64748b; font-size: 13px; margin-top: 20px;">If the button doesn't work, copy and paste this link: <br/><a href="${verifyUrl}">${verifyUrl}</a></p>
      </div>
    `,
  }),

  resetPassword: (name: string, resetUrl: string) => ({
    subject: 'Reset your ClientFlow password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1e293b;">
        <h2 style="color: #4f46e5;">Reset Password Request</h2>
        <p>Hi ${name},</p>
        <p>You requested a password reset for your ClientFlow account. Click below to set a new password:</p>
        <p><a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #4f46e5; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 12px;">Reset Password</a></p>
        <p style="color: #64748b; font-size: 13px;">This link will expire in 1 hour. If you did not request this, you can safely ignore this email.</p>
      </div>
    `,
  }),

  invitation: (orgName: string, inviterName: string, inviteUrl: string, role: string) => ({
    subject: `You have been invited to join ${orgName} on ClientFlow`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1e293b;">
        <h2 style="color: #4f46e5;">Team Invitation</h2>
        <p>${inviterName} has invited you to join <strong>${orgName}</strong> on ClientFlow as a <strong>${role}</strong>.</p>
        <p><a href="${inviteUrl}" style="display: inline-block; padding: 12px 24px; background-color: #4f46e5; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 12px;">Accept Invitation</a></p>
      </div>
    `,
  }),

  leadAssigned: (name: string, leadName: string, company: string, leadUrl: string) => ({
    subject: `New Lead Assigned: ${leadName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1e293b;">
        <h2 style="color: #4f46e5;">New Lead Assigned to You</h2>
        <p>Hi ${name},</p>
        <p>A new lead has been assigned to your sales pipeline:</p>
        <ul>
          <li><strong>Lead:</strong> ${leadName}</li>
          <li><strong>Company:</strong> ${company || 'N/A'}</li>
        </ul>
        <p><a href="${leadUrl}" style="display: inline-block; padding: 12px 24px; background-color: #4f46e5; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 12px;">View Lead</a></p>
      </div>
    `,
  }),

  subscriptionConfirmed: (orgName: string, plan: string) => ({
    subject: `Subscription Confirmed: ${plan} Plan for ${orgName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1e293b;">
        <h2 style="color: #10b981;">Subscription Activated!</h2>
        <p>Thank you for upgrading <strong>${orgName}</strong> to the <strong>${plan}</strong> plan.</p>
        <p>Your team now has access to all higher tier features, unlimited limits, and priority analytics.</p>
        <p><a href="${config.frontendUrl}/billing" style="display: inline-block; padding: 12px 24px; background-color: #4f46e5; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 12px;">Manage Billing</a></p>
      </div>
    `,
  }),
};
