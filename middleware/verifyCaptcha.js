const { RecaptchaEnterpriseServiceClient } = require('@google-cloud/recaptcha-enterprise');
const dotenv = require('dotenv');
dotenv.config();

const projectID = "student-tracker-448308"; // Replace with your Google Cloud Project ID
const recaptchaKey = "6LfB29QqAAAAAHo2JKtWWZx24MoRn75EMb0NKg3s"; // Replace with your reCAPTCHA site key

const client = new RecaptchaEnterpriseServiceClient();
const projectPath = client.projectPath(projectID);

const verifyCaptcha = async (req, res, next) => {
    const { captcha } = req.body;
    if (!captcha) {
        return res.status(400).json({ status: "captcha_failed", error: "CAPTCHA token missing" });
    }

    try {
        const request = {
            parent: projectPath,
            assessment: {
                event: {
                    token: captcha,
                    siteKey: recaptchaKey,
                },
            },
        };

        const [response] = await client.createAssessment(request);

        if (!response.tokenProperties.valid) {
            console.log("Invalid reCAPTCHA token: ", response.tokenProperties.invalidReason);
            return res.status(400).json({ status: "captcha_failed", error: "Invalid CAPTCHA token" });
        }

        if (response.tokenProperties.action !== "LOGIN") {
            console.log("Invalid reCAPTCHA action");
            return res.status(400).json({ status: "captcha_failed", error: "Invalid reCAPTCHA action" });
        }

        console.log(`reCAPTCHA score: ${response.riskAnalysis.score}`);
        if (response.riskAnalysis.score < 0.5) {
            return res.status(400).json({ status: "captcha_failed", error: "Low reCAPTCHA score, potential bot detected" });
        }

        next();
    } catch (err) {
        console.error("reCAPTCHA Error:", err);
        return res.status(500).json({ status: "error", error: "Server error verifying CAPTCHA" });
    }
};

module.exports = verifyCaptcha;
