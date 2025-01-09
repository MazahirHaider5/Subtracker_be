import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_SENDER_NAME,
    pass: process.env.MAIL_SENDER_PASS,
  },
});

export async function sendMail(email: string, subject: string, body: string) {
  try {
    const info = await transporter.sendMail({
      from: `"Subtrack" <${process.env.MAIL_SENDER_NAME}>`,
      to: email,
      subject: subject,
      text: body,
    });
    console.log("Email sent: ", info.response);
  } catch (error) {
    console.error("Error sending email: ", error);
  }
}
