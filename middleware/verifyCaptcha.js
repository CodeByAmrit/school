const { RecaptchaEnterpriseServiceClient } = require('@google-cloud/recaptcha-enterprise');
const path = require('path');

// Set Google Cloud credentials manually
process.env.GOOGLE_APPLICATION_CREDENTIALS = path.join(__dirname, "..", 'captcha.json');

const client = new RecaptchaEnterpriseServiceClient();

const verifyCaptcha = async (req, res, next) => {
    const { captcha } = req.body;

    if (!captcha) {
        return res.status(400).json({ status: "captcha_failed", error: "CAPTCHA token missing" });
    }

    try {
        const projectID = "student-tracker-448308";
        const recaptchaKey = "6LfB29QqAAAAAHo2JKtWWZx24MoRn75EMb0NKg3s";

        const projectPath = client.projectPath(projectID);

        const [response] = await client.createAssessment({
            parent: projectPath,
            assessment: {
                event: {
                    token: captcha,
                    siteKey: recaptchaKey,
                },
            },
        });

        if (!response.tokenProperties.valid) {
            console.error(`reCAPTCHA token invalid: ${response.tokenProperties.invalidReason}`);
            return res.status(400).json({ status: "captcha_failed", error: "Invalid CAPTCHA token" });
        }

        if (response.tokenProperties.action !== "LOGIN") {
            return res.status(400).json({ status: "captcha_failed", error: "Invalid CAPTCHA action" });
        }

        console.log(`reCAPTCHA score: ${response.riskAnalysis.score}`);
        if (response.riskAnalysis.score < 0.5) {
            return res.status(400).json({ status: "captcha_failed", error: "Suspicious activity detected" });
        }

        next();
    } catch (err) {
        console.error("reCAPTCHA Error:", err);
        return res.status(500).json({ status: "error", error: "Server error verifying CAPTCHA" });
    }
};

module.exports = verifyCaptcha;
