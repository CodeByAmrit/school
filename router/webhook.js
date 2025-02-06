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
    console.log("✅ Webhook received. Deploying latest changes...");

    // Run Git Pull, Install Dependencies, and Restart PM2
    exec(
        `cd ${APP_DIRECTORY} && git pull origin master && npm install && pm2 restart ${PM2_APP_NAME}`,
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
});

module.exports = router;
