const functions = require("firebase-functions");
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "your_email@gmail.com",
    pass: "app_password"
  }
});

exports.sendEmail = functions.https.onCall(async (data) => {
  await transporter.sendMail({
    from: "Your App <your_email@gmail.com>",
    to: data.to,
    subject: data.subject,
    text: data.message
  });

  return { success: true };
});