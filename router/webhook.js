const express = require("express");
const crypto = require("crypto");
const { exec } = require("child_process");
const path = require("path");
require("dotenv").config(); // Load environment variables

const router = express.Router();
const GITHUB_SECRET = process.env.GITHUB_SECRET;
const APP_DIRECTORY = path.resolve(__dirname, ".."); // Root directory of your project
const PM2_APP_NAME = "school"; // Change this to your PM2 process name

router.post("/", (req, res) => {
    const signature = req.headers["x-hub-signature-256"];

    if (!signature) {
        console.warn("⚠️ No signature found in webhook request!");
        return res.status(400).send("Signature required");
    }

    // Generate hash using the secret and request body
    const hash = `sha256=${crypto.createHmac("sha256", GITHUB_SECRET).update(req.body).digest("hex")}`;

    // Verify the signature
    if (crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(hash))) {
        console.log("✅ Signature verified. Deploying latest changes...");

        // Run Git Pull, Install Dependencies, and Restart PM2
        exec(
            `cd ${APP_DIRECTORY} && git pull origin main && npm install && nssm restart school && nssm restart nginx`,
            (error, stdout, stderr) => {
                if (error) {
                    console.error(`❌ Deployment error: ${error.message}`);
                    return res.status(500).send("Deployment failed");
                }
                console.log(`✅ Deployment successful!\n${stdout}`);
                console.error(`⚠️ Deployment warnings/errors:\n${stderr}`);
                res.status(200).send("Deployment completed successfully");
            }
        );
    } else {
        console.warn("❌ Invalid signature. Request rejected.");
        return res.status(403).send("Invalid signature");
    }
});

module.exports = router;
