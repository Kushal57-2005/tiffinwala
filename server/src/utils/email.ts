import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

export const sendEmailOTP = async (
    email: string,
    otp: string,
): Promise<void> => {
    try {
        await transporter.sendMail({
            from: `"TiffinWala" <${process.env.SMTP_USER}>`,
            to: email,
            subject: 'Your TiffinWala Email Verification OTP',
            html: `<h2>Email Verification</h2>
               <p>Your OTP is: <strong>${otp}</strong></p>`,
        });

    } catch (error) {
        console.error('Email OTP failed:', error);
    }
};

export const sendMonthlyBillEmail = async (
    email: string,
    name: string,
    htmlContent: string,
): Promise<void> => {
    await transporter.sendMail({
        from: `"TiffinWala" <${process.env.SMTP_USER}>`,
        to: email,
        subject: 'Your TiffinWala Monthly Bill',
        html: htmlContent,
    });
};
