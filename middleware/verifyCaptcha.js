const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config();
const { RecaptchaEnterpriseServiceClient } = require('@google-cloud/recaptcha-enterprise');

// async function createAssessment({
//     projectID = "student-tracker-448308",
//     recaptchaKey = "6LfB29QqAAAAAHo2JKtWWZx24MoRn75EMb0NKg3s",
//     token = "action-token",
//     recaptchaAction = "LOGIN",
// }) {
//     // Create the reCAPTCHA client.
//     // TODO: Cache the client generation code (recommended) or call client.close() before exiting the method.
//     const client = new RecaptchaEnterpriseServiceClient();
//     const projectPath = client.projectPath(projectID);

//     // Build the assessment request.
//     const request = ({
//         assessment: {
//             event: {
//                 token: token,
//                 siteKey: recaptchaKey,
//             },
//         },
//         parent: projectPath,
//     });

//     const [response] = await client.createAssessment(request);

//     // Check if the token is valid.
//     if (!response.tokenProperties.valid) {
//         console.log(`The CreateAssessment call failed because the token was: ${response.tokenProperties.invalidReason}`);
//         return null;
//     }

//     // Check if the expected action was executed.
//     // The `action` property is set by user client in the grecaptcha.enterprise.execute() method.
//     if (response.tokenProperties.action === recaptchaAction) {
//         // Get the risk score and the reason(s).
//         // For more information on interpreting the assessment, see:
//         // https://cloud.google.com/recaptcha-enterprise/docs/interpret-assessment
//         console.log(`The reCAPTCHA score is: ${response.riskAnalysis.score}`);
//         response.riskAnalysis.reasons.forEach((reason) => {
//             console.log(reason);
//         });

//         next();
//     } else {
//         console.log("The action attribute in your reCAPTCHA tag does not match the action you are expecting to score");
//         return null;
//     }
// }

const verifyCaptcha = async (req, res, next) => {
    const { captcha } = req.body;

    if (!captcha) {
        return res.status(400).json({ status: "captcha_failed", error: "CAPTCHA token missing" });
    }

    try {
        const response = await axios.post(
            "https://www.google.com/recaptcha/api/siteverify",
            new URLSearchParams({
                secret: process.env.RECAPTCHA_SECRET_KEY,
                response: captcha,
            })
        );

        if (!response.data.success) {
            return res.status(400).json({ status: "captcha_failed", error: "CAPTCHA verification failed" });
        }

        next(); // CAPTCHA is valid, proceed to login function
    } catch (err) {
        console.error("reCAPTCHA Error:", err);
        return res.status(500).json({ status: "error", error: "Server error verifying CAPTCHA" });
    }
};

module.exports = verifyCaptcha;
