import nodemailer from "nodemailer";

const Email = async ({ to, subject, text, html }) => {
    try {
        const transporter = nodemailer.createTransport({
            host : 'smtp.gmail.com',
            port : 465,
            secure : true,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const info = await transporter.sendMail({
            from: `"StayMate" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            text,
            html
        });
        return info;
    }
    catch (error) {
        throw error; // let controller's AsyncHandler catch it
    }
};

export { Email };