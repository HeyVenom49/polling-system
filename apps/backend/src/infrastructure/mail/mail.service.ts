import nodemailer, { type Transporter } from "nodemailer";
import { env } from "../../config/env";

export type SendMailInput = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

export class MailService {
  private readonly transporter: Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    });
  }

  async sendMail(input: SendMailInput): Promise<void> {
    await this.transporter.sendMail({
      from: env.SMTP_USER,
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html,
    });
  }

  async sendEmailVerification(to: string, token: string): Promise<void> {
    const verifyUrl = `${env.CORS_ORIGIN}/verify-email?token=${encodeURIComponent(token)}`;

    await this.sendMail({
      to,
      subject: "Verify your email",
      text: `Verify your email by opening this link:\n${verifyUrl}\n\nOr use this token: ${token}\n\nThis link expires in ${env.EMAIL_VERIFY_EXPIRES_IN}.`,
      html: `<p>Verify your email by clicking the link below:</p><p><a href="${verifyUrl}">${verifyUrl}</a></p><p>Or use this token: <code>${token}</code></p><p>This link expires in ${env.EMAIL_VERIFY_EXPIRES_IN}.</p>`,
    });
  }

  async sendPasswordReset(to: string, token: string): Promise<void> {
    const resetUrl = `${env.CORS_ORIGIN}/reset-password?token=${encodeURIComponent(token)}`;

    await this.sendMail({
      to,
      subject: "Reset your password",
      text: `Reset your password by opening this link:\n${resetUrl}\n\nOr use this token: ${token}\n\nThis link expires in ${env.PASSWORD_RESET_EXPIRES_IN}. If you did not request this, ignore this email.`,
      html: `<p>Reset your password by clicking the link below:</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>Or use this token: <code>${token}</code></p><p>This link expires in ${env.PASSWORD_RESET_EXPIRES_IN}.</p><p>If you did not request this, ignore this email.</p>`,
    });
  }
}
