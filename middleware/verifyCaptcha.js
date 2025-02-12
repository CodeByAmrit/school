const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config();

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
