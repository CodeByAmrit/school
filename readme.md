![School Logo](public/image/logo.svg)

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

- 📚 **For Students** *(Coming Soon!)*  
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
