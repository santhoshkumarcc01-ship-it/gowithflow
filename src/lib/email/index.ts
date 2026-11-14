import nodemailer from 'nodemailer';

let cachedTransporter: nodemailer.Transporter | null = null;
let cachedPass = '';

function getTransporter(): nodemailer.Transporter | null {
  const smtpUser = process.env.SMTP_USER || 'santhoshkumarcc01@gmail.com';
  const smtpPass = (process.env.SMTP_PASS || 'oeqjstifbgicqogq').replace(/\s+/g, '');

  if (!smtpUser || !smtpPass) {
    return null;
  }

  if (cachedTransporter && cachedPass === smtpPass) {
    return cachedTransporter;
  }

  cachedPass = smtpPass;

  if (smtpUser.endsWith('@gmail.com') || process.env.SMTP_HOST === 'smtp.gmail.com') {
    cachedTransporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: smtpUser,
        pass: smtpPass
      }
    });
    return cachedTransporter;
  }

  const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
  const smtpPort = parseInt(process.env.SMTP_PORT || '587');

  cachedTransporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: smtpUser,
      pass: smtpPass
    }
  });
  return cachedTransporter;
}

export const EmailService = {
  async sendOtpEmail(email: string, otp: string): Promise<boolean> {
    const subject = `${otp} is your Career OS verification code`;
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 32px 24px; max-width: 540px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px;">
        <div style="margin-bottom: 24px; text-align: center;">
          <h1 style="color: #0f172a; font-size: 22px; font-weight: 800; letter-spacing: -0.02em; margin: 0;">Career OS</h1>
          <p style="color: #64748b; font-size: 13px; margin: 4px 0 0 0;">Learner Portal Authentication</p>
        </div>
        
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
          <p style="color: #475569; font-size: 14px; margin: 0 0 12px 0;">Your one-time login verification code is:</p>
          <div style="font-family: 'Courier New', Courier, monospace; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #1e293b; padding: 12px; background: #ffffff; border-radius: 8px; border: 1px dashed #cbd5e1; display: inline-block;">
            ${otp}
          </div>
          <p style="color: #94a3b8; font-size: 12px; margin: 16px 0 0 0;">Valid for 5 minutes. Never share this code with anyone.</p>
        </div>
        
        <p style="color: #94a3b8; font-size: 11px; text-align: center; line-height: 1.5; margin: 24px 0 0 0;">
          If you did not request this verification code, please ignore this email.
        </p>
      </div>
    `;

    const transporter = getTransporter();
    const smtpUser = process.env.SMTP_USER || 'santhoshkumarcc01@gmail.com';

    if (transporter) {
      try {
        await transporter.sendMail({
          from: `"Career OS" <${smtpUser}>`,
          to: email,
          subject,
          html
        });
        console.log(`[SMTP] OTP verification email dispatched successfully to ${email}`);
        return true;
      } catch (err: any) {
        console.error('[SMTP] Failed to send email via transporter:', err.message);
        throw err;
      }
    }

    // Local Dev fallback console log
    console.log(`\n==================================================`);
    console.log(`[SMTP-DEV] OTP Email for: ${email}`);
    console.log(`[SMTP-DEV] Verification Code: ${otp}`);
    console.log(`==================================================\n`);
    return true;
  }
};
