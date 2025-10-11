![School Logo](https://raw.githubusercontent.com/CodeByAmrit/school/5e4b126ebf1c8cd43b49f0213927914bb5e3dfe4/public/image/logo.svg)

**Student Tracker** is a comprehensive **Student Management System** designed for schools. It simplifies student data management, allowing teachers to register students, store essential documents, generate reports, and more. The platform ensures data security and provides useful features like email notifications, virtual ID cards, and annual report cards.

## 🚀 Features

- 👩‍🏫 **For Teachers**:
  - Register students with class details
  - Store parent information
  - Upload and manage student files (PDF, JPEG, Audio, Video)
  - Generate **Annual Report Cards** with **PDF generation (pdf-lib)**
  - Issue **Virtual ID Cards** for students
  - Send **Email Notifications** to parents/students
  - Securely store and manage student data
  - **NEW:** Google reCAPTCHA v3 integration for secure login

- 📚 **For Students** _(Coming Soon!)_
  - Access academic records and attendance
  - View report cards and virtual ID
  - Stay updated with school announcements

## 🛠️ Tech Stack

- **Backend**: Node.js, Express.js, MySQL
- **Frontend**: EJS, Tailwind CSS
- **Database**: MySQL (`mysql2` library)
- **Authentication & Security**: JSON cookies, `cookie-parser`, `body-parser`, Google reCAPTCHA v3
- **File Handling**: PDF/Audio/Video uploads, `pdf-lib` for report generation
- **Other Tools**: `npm` for package management

## ⚙️ Installation & Setup

### 1️⃣ Clone the Repository

```sh
git clone https://github.com/CodeByAmrit/school.git
cd school
```

### 2️⃣ Install Dependencies

```sh
npm install
```

### 3️⃣ Set Up Configuration

Create a `.env` file and add:

```ini
GITHUB_SECRET=your-github-webhook-secret-key
DB_HOST=your-database-host
DB_USER=your-database-user
DB_PASSWORD=your-database-password
DB_DATABASE=your-database-name
DB_PORT=your-database-port
jwt_token=your-jwt-password
EMAIL_ID=your-email-name
EMAIL_PASSWORD=your-email-password
DB_CA=your-CA-from-MySQL
```

Instead of using environment variables for Google reCAPTCHA credentials, create a `captcha.json` file in the project root with the following structure:

```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "your-private-key-id",
  "private_key": "your-private-key",
  "client_email": "your-client-email",
  "client_id": "your-client-id",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "your-client-cert-url"
}
```

Ensure this file is **excluded** from version control using `.gitignore` to keep your credentials secure.

### 4️⃣ Run the Application

```sh
npm start
```

The server will start at [http://localhost:3000](http://localhost:3000)

## Docker Setup

### 1. Build the Docker Image

```sh
docker build -t codebyamrit/student-tracker .
```

### 2. Run the Container

```sh
docker run -d --name school -p 3000:3000 codebyamrit/student-tracker
```

### 3. Stop and Remove the Container

```sh
docker stop school

docker rm school
```

### 4. View Running Containers

```sh
docker ps
```

### 5. Check Container Logs

```sh
docker logs -f school
```

## Environment Variables

Ensure that the following files are included in the project:

- `google-credentials.json`
- `captcha.json`
- `.env`

## Access the Application

Once the container is running, open http\://localhost:3000 in your browser.

## 🔄 GitHub Webhook for Auto Deployment

To automate deployment, configure a webhook in GitHub that triggers on `push` events. Add the following webhook route to your Express app:

```javascript
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

router.post('/webhook', verifySignature, (req, res) => {
  const payload = req.body;

  if (payload.ref === 'refs/heads/main') {
    console.log('New push detected on main branch. Deploying...');

    exec(
      `cd ${APP_DIRECTORY} && git pull origin main && npm install`,
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

module.exports = router;
```

## 🔐 Database Connection

The application uses MySQL with the `mysql2` package.  
A `getConnection()` function manages secure database connections efficiently.

## 🏫 School Details Customization

School details (such as name, logo, etc.) can be modified by teachers through the Settings section.

## 📧 Contact

Developed by Amrit Sharma

🌐 Website: [www.school.codebyamrit.co.in](http://www.codebyamrit.co.in)  
📧 Email: [me.sharma.amrit@gmail.com](mailto:me.sharma.amrit@gmail.com)  
📱 Phone: +91 9817044885
