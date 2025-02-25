const express = require("express");
const { OAuth2Client } = require("google-auth-library");
const { getConnection } = require("../models/getConnection");
const { setUser } = require("./aouth");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const fs = require("fs");
const path = require("path");

dotenv.config();

const router = express.Router();
router.use(cookieParser());

// Load Google OAuth credentials
const credentials = JSON.parse(fs.readFileSync(path.join(__dirname, "..", 'google-credentials.json'), "utf8"));
const CLIENT_ID = credentials.web.client_id;
const CLIENT_SECRET = credentials.web.client_secret;
const REDIRECT_URI = credentials.web.redirect_uris[0];

const client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

// Google Login Route (Redirect to Google)
router.get("/auth/google", (req, res) => {
    const url = client.generateAuthUrl({
        access_type: "offline",
        scope: ["profile", "email"]
    });
    res.redirect(url);
});

// Google OAuth Callback
router.get("/auth/google/callback", async (req, res) => {
    try {
        const { tokens } = await client.getToken(req.query.code);
        client.setCredentials(tokens);

        // Get user info from Google
        const userInfo = await client.request({ url: "https://www.googleapis.com/oauth2/v2/userinfo" });
        const { email, name, picture } = userInfo.data;

        // Get DB Connection
        const connection = await getConnection();
        const [rows] = await connection.execute("SELECT * FROM teacher WHERE email = ?", [email]);
        await connection.end();

        if (rows.length > 0) {
            const teacher = rows[0];
            const token = setUser({
                id: teacher.id,
                email: teacher.email,
                first_name: teacher.first_name,
                last_name: teacher.last_name,
                school_address: teacher.school_address,
                school_name: teacher.school_name,
                school_phone: teacher.school_phone
            });

            res.cookie("token", token, { httpOnly: true, secure: process.env.NODE_ENV === "production" });

            return res.redirect("/dashboard"); // Redirect to the dashboard
        } else {
            return res.status(403).send("Access denied. Your email is not registered.");
        }
    } catch (error) {
        console.error("OAuth Error:", error);
        return res.status(500).send("Authentication failed.");
    }
});

// Logout Route
router.get("/logout", (req, res) => {
    res.clearCookie("token");
    res.redirect("/login");
});

module.exports = router;
