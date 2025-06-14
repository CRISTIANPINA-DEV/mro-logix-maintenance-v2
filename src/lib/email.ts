import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

interface SMSReportEmailData {
  reportNumber: string;
  reporterName?: string;
  date: string;
  timeOfEvent?: string;
  reportTitle: string;
  reportDescription: string;
}

// Configure your email transporter with Hostinger credentials
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST,
  port: parseInt(process.env.EMAIL_SERVER_PORT || '465'),
  secure: true,
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
});

/**
 * Sends an email using the configured mail service
 * @param options Email options including recipient, subject, and HTML content
 */
export async function sendEmail(options: EmailOptions): Promise<void> {
  try {
    await transporter.sendMail({
      from: `"MRO Logix" <${process.env.EMAIL_FROM}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send email');
  }
}

/**
 * Sends a PIN verification email
 * @param to Email address to send to
 * @param pin The PIN code
 * @param firstName First name of the recipient
 */
export async function sendPinEmail(to: string, pin: string, firstName: string): Promise<void> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Email Verification</h2>
      <p>Hello ${firstName},</p>
      <p>Please use the following PIN to verify your email address:</p>
      <div style="text-align: center; margin: 30px 0;">
        <div style="background-color: #f3f4f6; padding: 12px 24px; display: inline-block; border-radius: 4px; font-size: 24px; font-family: monospace;">
          ${pin}
        </div>
      </div>
      <p>This PIN will expire in 3 minutes.</p>
      <p>If you did not request this verification, please ignore this email.</p>
      <p>Thank you,<br/>MRO Logix Team</p>
    </div>
  `;

  await sendEmail({
    to,
    subject: 'Email Verification - MRO Logix',
    html
  });
}

/**
 * Sends an SMS report copy via email
 * @param to Email address to send to
 * @param data SMS report data
 */
export async function sendSMSReportEmail(to: string, data: SMSReportEmailData): Promise<void> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>SMS Report Copy - ${data.reportNumber}</h2>
      <p>Hello ${data.reporterName || 'Reporter'},</p>
      <p>Thank you for submitting your SMS report. Here is a copy of your submission:</p>
      
      <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #8b5cf6;">Report Details</h3>
        <p><strong>Report Number:</strong> ${data.reportNumber}</p>
        <p><strong>Event Date:</strong> ${data.date}</p>
        ${data.timeOfEvent ? `<p><strong>Time of Event:</strong> ${data.timeOfEvent}</p>` : ''}
        <p><strong>Reporter:</strong> ${data.reporterName || 'Anonymous'}</p>
        
        <h4 style="color: #374151;">Report Title</h4>
        <p>${data.reportTitle}</p>
        
        <h4 style="color: #374151;">Description</h4>
        <p style="white-space: pre-wrap;">${data.reportDescription}</p>
      </div>
      
      <p>Your report has been successfully submitted and will be reviewed by the appropriate personnel.</p>
      <p>Thank you for helping to maintain safety standards.</p>
      <p>MRO Logix Team</p>
    </div>
  `;

  await sendEmail({
    to,
    subject: `SMS Report Copy - ${data.reportNumber}`,
    html
  });
}
