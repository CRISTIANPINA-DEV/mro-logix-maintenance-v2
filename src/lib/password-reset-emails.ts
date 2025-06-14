import nodemailer from 'nodemailer';

// Configure your email transporter with Hostinger credentials
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST,
  port: parseInt(process.env.EMAIL_SERVER_PORT || '465'),
  secure: true, // Use SSL/TLS
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
});



export async function sendPasswordResetEmail(to: string, firstName: string, resetToken: string) {
  // Get the base URL with fallback
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://mro-logix.com';
  const resetLink = `${baseUrl}/reset-password?token=${resetToken}`;
  

  
  const mailOptions = {
    from: `"MRO Logix" <${process.env.EMAIL_FROM}>`,
    to,
    subject: 'Reset Your MRO Logix Password',
    text: `Hello ${firstName},\n\nWe received a request to reset your password. Click the link below to set a new password:\n\n${resetLink}\n\nThis link will expire in 15 minutes.\n\nIf you didn't request this password reset, please ignore this email.\n\nThank you,\nMRO Logix Team`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Reset Your Password</h2>
        <p>Hello ${firstName},</p>
        <p>We received a request to reset your password. Click the button below to set a new password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" style="background-color: #f43f5e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Reset Password</a>
        </div>
        <p>This link will expire in 15 minutes.</p>
        <p>If you didn't request this password reset, please ignore this email.</p>
        <p>Thank you,<br/>MRO Logix Team</p>
      </div>
    `,
  };

  try {

    await transporter.sendMail(mailOptions);
    console.log('Password reset email sent successfully');
    return { success: true };
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return { success: false, error };
  }
}

export async function sendPasswordChangeConfirmationEmail(to: string, firstName: string) {
  const mailOptions = {
    from: `"MRO Logix" <${process.env.EMAIL_FROM}>`,
    to,
    subject: 'Your MRO Logix Password Has Been Changed',
    text: `Hello ${firstName},\n\nYour password has been successfully changed.\n\nIf you did not make this change, please contact the administrator immediately or try resetting your password again.\n\nThank you,\nMRO Logix Team`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Password Changed Successfully</h2>
        <p>Hello ${firstName},</p>
        <p>Your password has been successfully changed.</p>
        <p style="color: #e11d48; font-weight: bold;">If you did not make this change, please contact the administrator immediately or try resetting your password again.</p>
        <p>Thank you,<br/>MRO Logix Team</p>
      </div>
    `,
  };

  try {

    await transporter.sendMail(mailOptions);
    console.log('Confirmation email sent successfully');
    return { success: true };
  } catch (error) {
    console.error('Error sending password change confirmation email:', error);
    return { success: false, error };
  }
} 