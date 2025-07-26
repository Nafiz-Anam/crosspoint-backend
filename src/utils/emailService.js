const nodemailer = require("nodemailer");

const email_service = async (toEmail, emailBody) => {
    let transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: true,
        auth: {
            user: process.env.SMTP_EMAIL,
            pass: process.env.SMTP_PASS,
        },
    });

    let message = {
        from: process.env.SMTP_EMAIL,
        to: toEmail,
        subject: "Forgot password OTP",
        text: emailBody,
        // html: invoiceTemplate(emailData), // html body
    };

    transporter
        .sendMail(message)
        .then((info) => {
            return true;
        })
        .catch((error) => {
            console.log(error);
            return false;
        });
};

module.exports = email_service;
