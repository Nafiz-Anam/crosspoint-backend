import nodemailer from "nodemailer";
import config from "../config/config";
import logger from "../config/logger";

const transport = nodemailer.createTransport({
  ...config.email.smtp,
  secure: true, // Use SSL for port 465
  tls: {
    rejectUnauthorized: false, // Allow self-signed certificates
  },
});
/* istanbul ignore next */
if (config.env !== "test") {
  transport
    .verify()
    .then(() => logger.info("Connected to email server"))
    .catch(() =>
      logger.warn(
        "Unable to connect to email server. Make sure you have configured the SMTP options in .env"
      )
    );
}

/**
 * Send an email
 * @param {string} to
 * @param {string} subject
 * @param {string} text
 * @returns {Promise}
 */
const sendEmail = async (to: string, subject: string, text: string) => {
  const msg = { from: config.email.from, to, subject, text };
  await transport.sendMail(msg);
};

/**
 * Send reset password email
 * @param {string} to
 * @param {string} token
 * @returns {Promise}
 */
const sendResetPasswordEmail = async (to: string, token: string) => {
  const subject = "Reset password";
  // Frontend URL for reset password page
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  const resetPasswordUrl = `${frontendUrl}/pages/auth/reset-password-v2?token=${token}`;
  const text = `Dear user,
To reset your password, click on this link: ${resetPasswordUrl}
If you did not request any password resets, then ignore this email.`;
  await sendEmail(to, subject, text);
};

/**
 * Send verification email
 * @param {string} to
 * @param {string} token
 * @returns {Promise}
 */
const sendVerificationEmail = async (to: string, token: string) => {
  const subject = "Email Verification";
  // replace this url with the link to the email verification page of your front-end app
  const verificationEmailUrl = `http://link-to-app/verify-email?token=${token}`;
  const text = `Dear user,
To verify your email, click on this link: ${verificationEmailUrl}`;
  await sendEmail(to, subject, text);
};

/**
 * Send reset password OTP email
 * @param {string} to
 * @param {string} otp
 * @returns {Promise}
 */
const sendResetPasswordOTP = async (to: string, otp: string) => {
  const subject = "Password Reset OTP";
  const text = `Dear user,
Your password reset OTP is: ${otp}

This OTP is valid for 10 minutes. Please do not share this OTP with anyone.

If you did not request a password reset, please ignore this email.`;
  await sendEmail(to, subject, text);
};

export default {
  transport,
  sendEmail,
  sendResetPasswordEmail,
  sendVerificationEmail,
  sendResetPasswordOTP,
};
