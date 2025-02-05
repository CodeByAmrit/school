const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
dotenv.config();


async function sendEmail(recipientEmail, studentData) {
    console.log(process.env.EMAIL_PASSWORD);
    let transporter = nodemailer.createTransport({
        host: "smtp.zoho.in",
        port: 465,
        secure: true,
        auth: {
            user: "student@codebyamrit.co.in",
            pass: process.env.EMAIL_PASSWORD,
        },
    });

    let emailHTML = `
        <html>
        <body>
            <div style="font-family: Arial, sans-serif; padding: 20px;">
                <h2>Student Tracker - Stay Updated</h2>
                <p>Dear <strong>${studentData.name}</strong>,</p>
                <p>Your recent student-related update is now available:</p>
                <ul>
                    <li><strong>Admission Status:</strong> ${studentData.admissionStatus}</li>
                    <li><strong>Attendance Report:</strong> ${studentData.attendance}%</li>
                    <li><strong>Latest Marks:</strong> ${studentData.marksObtained}/${studentData.totalMarks}</li>
                    <li><strong>Overall Percentage:</strong> ${studentData.percentage}%</li>
                </ul>
                <p><a href="${studentData.actionUrl}" style="background:#007bff;color:#fff;padding:10px 20px;text-decoration:none;border-radius:5px;">View Details</a></p>
                <p>For support, contact <a href="mailto:support@studenttracker.com">support@studenttracker.com</a></p>
                <p>&copy; 2025 Student Tracker. All rights reserved.</p>
            </div>
        </body>
        </html>
    `;

    let info = await transporter.sendMail({
        from: '"Student Tracker" student@codebyamrit.co.in',
        to: recipientEmail,
        subject: "Your Student Tracker Update",
        html: emailHTML,
    });

    console.log("Email sent: " + info.response);
}

async function sendOTPEmail(teacherEmail, otp) {
    let transporter = nodemailer.createTransport({
        host: "smtp.zoho.in",
        port: 465,
        secure: true,
        auth: {
            user: "student@codebyamrit.co.in",
            pass: process.env.EMAIL_PASSWORD,  // Use environment variable for security
        },
    });
    let emailHTML = `
    <html>
    <body style="background-color: #f3f4f6; font-family: Arial, sans-serif; margin: 0; padding: 0;">
        <div style="max-width: 600px; margin: auto; background: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1); text-align: center;">
            
            <img src="https://edu.codebyamrit.co.in/image/logo.svg" alt="Student Tracker" style="width: 300px; display: block; margin: 0 auto;">
            
            <h2 style="color: #2563eb; font-size: 24px; font-weight: bold;">OTP for Account Verification</h2>
            
            <p style="font-size: 16px; color: #4b5563;">Dear <strong style="color: #2563eb;">${teacherEmail}</strong>,</p>
            <p style="color: #4b5563;">We received a request to verify your teacher account. Use the OTP below to verify your account:</p>
            
            <div style="background: #bfdbfe; color: #1e3a8a; font-size: 20px; font-weight: bold; padding: 10px; border-radius: 5px; margin-top: 10px;">
                ${otp}
            </div>

            <p style="margin-top: 10px; color: #4b5563;">If you didn't request this, please ignore this email.</p>
            
            <p style="margin-top: 10px; font-size: 14px; color: #6b7280;">For support, contact us at <a href="mailto:support@studenttracker.com" style="color: #2563eb; text-decoration: none;">support@studenttracker.com</a></p>
        </div>
    </body>
    </html>
`;


    let info = await transporter.sendMail({
        from: '"Student Tracker" <student@codebyamrit.co.in>',
        to: teacherEmail,
        subject: "OTP for Account Verification",
        html: emailHTML,
    });

    console.log("OTP email sent: " + info.response);
    return true;
}


module.exports = { sendEmail, sendOTPEmail };
