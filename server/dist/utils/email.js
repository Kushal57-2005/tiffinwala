"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMonthlyBillEmail = exports.sendEmailOTP = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const transporter = nodemailer_1.default.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});
const sendEmailOTP = async (email, otp) => {
    console.log('sending...email');
    console.log(`📭 Email OTP for ${email}: ${otp}`);
    try {
        await transporter.sendMail({
            from: `"TiffinWala" <${process.env.SMTP_USER}>`,
            to: email,
            subject: 'Your TiffinWala Email Verification OTP',
            html: `<h2>Email Verification</h2>
               <p>Your OTP is: <strong>${otp}</strong></p>`,
        });
        console.log('✅ Email sent');
    }
    catch (error) {
        console.error('❌ Email failed:', error);
    }
};
exports.sendEmailOTP = sendEmailOTP;
const sendMonthlyBillEmail = async (email, name, htmlContent) => {
    await transporter.sendMail({
        from: `"TiffinWala" <${process.env.SMTP_USER}>`,
        to: email,
        subject: 'Your TiffinWala Monthly Bill',
        html: htmlContent,
    });
};
exports.sendMonthlyBillEmail = sendMonthlyBillEmail;
//# sourceMappingURL=email.js.map