const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  // Use SMTP config from environment variables
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  return transporter;
};

// Send OTP email
const sendOTPEmail = async (email, otp) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.FROM_EMAIL || `"NGO Connect" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Password Reset OTP - NGO Connect',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626;">Password Reset Request</h2>
          <p>Hello,</p>
          <p>You have requested to reset your password for your NGO Connect account.</p>
          <p>Your One-Time Password (OTP) is:</p>
          <div style="background-color: #f3f4f6; padding: 20px; text-align: center; margin: 20px 0;">
            <h1 style="color: #dc2626; font-size: 32px; margin: 0; letter-spacing: 5px;">${otp}</h1>
          </div>
          <p><strong>This OTP will expire in 15 minutes.</strong></p>
          <p>If you didn't request this password reset, please ignore this email.</p>
          <p>For security reasons, please do not share this OTP with anyone.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          <p style="color: #6b7280; font-size: 14px;">
            This is an automated message from NGO Connect. Please do not reply to this email.
          </p>
        </div>
      `,
      text: `
        Password Reset Request - NGO Connect

        Hello,

        You have requested to reset your password for your NGO Connect account.

        Your One-Time Password (OTP) is: ${otp}

        This OTP will expire in 15 minutes.

        If you didn't request this password reset, please ignore this email.

        For security reasons, please do not share this OTP with anyone.

        This is an automated message from NGO Connect. Please do not reply to this email.
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('OTP email sent successfully:', info.messageId);

    // For Ethereal (development), log the preview URL
    if (process.env.NODE_ENV === 'development' && info.messageId) {
      console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
    }

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending OTP email:', error);
    throw new Error('Failed to send OTP email');
  }
};

// Send welcome email (for future use)
const sendWelcomeEmail = async (email, name) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"NGO Connect" <${process.env.EMAIL_USER || 'noreply@ngoconnect.com'}>`,
      to: email,
      subject: 'Welcome to NGO Connect!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626;">Welcome to NGO Connect!</h2>
          <p>Hello ${name},</p>
          <p>Thank you for joining NGO Connect! We're excited to have you as part of our community.</p>
          <p>You can now:</p>
          <ul>
            <li>Connect with volunteers and NGOs</li>
            <li>Find opportunities to make a difference</li>
            <li>Build meaningful partnerships</li>
          </ul>
          <p>Get started by completing your profile and exploring opportunities in your area.</p>
          <p>Welcome aboard!</p>
          <p>The NGO Connect Team</p>
        </div>
      `,
      text: `
        Welcome to NGO Connect!

        Hello ${name},

        Thank you for joining NGO Connect! We're excited to have you as part of our community.

        You can now:
        - Connect with volunteers and NGOs
        - Find opportunities to make a difference
        - Build meaningful partnerships

        Get started by completing your profile and exploring opportunities in your area.

        Welcome aboard!

        The NGO Connect Team
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Welcome email sent successfully:', info.messageId);

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending welcome email:', error);
    throw new Error('Failed to send welcome email');
  }
};

// Send application notification email to NGO
const sendApplicationNotificationEmail = async (ngoEmail, ngoName, volunteerName, opportunityTitle) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.FROM_EMAIL || `"NGO Connect" <${process.env.SMTP_USER}>`,
      to: ngoEmail,
      subject: 'New Application Received - NGO Connect',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #059669;">New Application Received!</h2>
          <p>Hello ${ngoName},</p>
          <p>Great news! You have received a new application for your opportunity.</p>
          <div style="background-color: #f0fdf4; padding: 20px; border-left: 4px solid #059669; margin: 20px 0;">
            <p><strong>Volunteer:</strong> ${volunteerName}</p>
            <p><strong>Opportunity:</strong> ${opportunityTitle}</p>
          </div>
          <p>Please log in to your NGO Connect dashboard to review the application and contact the volunteer.</p>
          <p><a href="${process.env.CLIENT_URL || 'http://localhost:5173'}" style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">Review Application</a></p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          <p style="color: #6b7280; font-size: 14px;">
            This is an automated message from NGO Connect.
          </p>
        </div>
      `,
      text: `New Application Received - NGO Connect\n\nHello ${ngoName},\n\nGreat news! You have received a new application.\n\nVolunteer: ${volunteerName}\nOpportunity: ${opportunityTitle}\n\nPlease log in to review the application.`
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Application notification email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending application notification email:', error);
    throw new Error('Failed to send application notification email');
  }
};

// Send status update notification email to volunteer
const sendStatusUpdateNotificationEmail = async (volunteerEmail, volunteerName, status, opportunityTitle, ngoName) => {
  try {
    const transporter = createTransporter();

    const statusColors = {
      'accepted': '#059669',
      'rejected': '#dc2626'
    };

    const statusMessages = {
      'accepted': 'Congratulations! Your application has been accepted',
      'rejected': 'Thank you for your interest. Your application was not selected this time'
    };

    const mailOptions = {
      from: process.env.FROM_EMAIL || `"NGO Connect" <${process.env.SMTP_USER}>`,
      to: volunteerEmail,
      subject: `Application ${status.charAt(0).toUpperCase() + status.slice(1)} - NGO Connect`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: ${statusColors[status] || '#6b7280'};">Application Update</h2>
          <p>Hello ${volunteerName},</p>
          <p>We have an update on your application:</p>
          <div style="background-color: ${status === 'accepted' ? '#f0fdf4' : '#fef2f2'}; padding: 20px; border-left: 4px solid ${statusColors[status] || '#6b7280'}; margin: 20px 0;">
            <p><strong>${statusMessages[status]}</strong></p>
            <p><strong>Opportunity:</strong> ${opportunityTitle}</p>
            <p><strong>NGO:</strong> ${ngoName}</p>
          </div>
          ${status === 'accepted' ? 
            '<p>The NGO will be in touch with you soon with next steps. You can also message them directly through your dashboard.</p>' : 
            '<p>Don\'t give up! There are many other opportunities waiting for you on NGO Connect.</p>'
          }
          <p><a href="${process.env.CLIENT_URL || 'http://localhost:5173'}" style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">View Dashboard</a></p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          <p style="color: #6b7280; font-size: 14px;">
            This is an automated message from NGO Connect.
          </p>
        </div>
      `,
      text: `Application ${status} - NGO Connect\n\nHello ${volunteerName},\n\n${statusMessages[status]} for "${opportunityTitle}" by ${ngoName}.\n\nPlease log in to view your dashboard.`
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Status update notification email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending status update notification email:', error);
    throw new Error('Failed to send status update notification email');
  }
};

// Send opportunity match notification email to volunteer
const sendOpportunityMatchNotificationEmail = async (volunteerEmail, volunteerName, opportunityTitle, ngoName) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.FROM_EMAIL || `"NGO Connect" <${process.env.SMTP_USER}>`,
      to: volunteerEmail,
      subject: 'Perfect Opportunity Match Found! - NGO Connect',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #7c3aed;">Perfect Match Found!</h2>
          <p>Hello ${volunteerName},</p>
          <p>We found an opportunity that's perfect for you!</p>
          <div style="background-color: #faf5ff; padding: 20px; border-left: 4px solid #7c3aed; margin: 20px 0;">
            <p><strong>Opportunity:</strong> ${opportunityTitle}</p>
            <p><strong>NGO:</strong> ${ngoName}</p>
          </div>
          <p>This opportunity matches your skills and interests. Don't miss out on this chance to make a difference!</p>
          <p><a href="${process.env.CLIENT_URL || 'http://localhost:5173'}" style="background-color: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">View Opportunity</a></p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          <p style="color: #6b7280; font-size: 14px;">
            This is an automated message from NGO Connect.
          </p>
        </div>
      `,
      text: `Perfect Opportunity Match Found! - NGO Connect\n\nHello ${volunteerName},\n\nWe found a perfect opportunity for you: "${opportunityTitle}" by ${ngoName}.\n\nPlease log in to view the opportunity.`
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Opportunity match notification email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending opportunity match notification email:', error);
    throw new Error('Failed to send opportunity match notification email');
  }
};

module.exports = {
  sendOTPEmail,
  sendWelcomeEmail,
  sendApplicationNotificationEmail,
  sendStatusUpdateNotificationEmail,
  sendOpportunityMatchNotificationEmail
};
