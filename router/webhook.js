const express = require('express');
const crypto = require('crypto');
const { exec } = require('child_process');
const path = require('path');
require('dotenv').config(); // Load environment variables

const router = express.Router();
const GITHUB_SECRET = process.env.GITHUB_SECRET;
const APP_DIRECTORY = path.resolve(__dirname, '..'); // Root directory of your project
const PM2_APP_NAME = 'school'; // Change this to your PM2 process name

function verifySignature(req, res, next) {
  const signature = req.headers['x-hub-signature-256'];
  if (!signature) return res.status(401).send('Unauthorized');

  const hmac = crypto.createHmac('sha256', GITHUB_SECRET);
  const digest =
    'sha256=' + hmac.update(JSON.stringify(req.body)).digest('hex');

  if (signature !== digest) return res.status(403).send('Invalid signature');

  next();
}

router.post('/', (req, res) => {
  const payload = req.body;
  console.log('webhook entry -- >');

  if (payload.ref === 'refs/heads/master') {
    console.log('New push detected on main branch. Deploying...');

    exec(
      `cd ${APP_DIRECTORY} && git pull && npm install`,
      (err, stdout, stderr) => {
        if (err) {
          console.error(`Deployment error: ${stderr}`);
          return res.status(500).send('Deployment failed');
        }
        console.log(`Deployment output: ${stdout}`);
        res.status(200).send('Deployment successful');
      }
    );
  } else {
    res.status(200).send('No action needed');
  }
});

router.get('/', (req, res) => {
  res.send('HI');
});
module.exports = router;
