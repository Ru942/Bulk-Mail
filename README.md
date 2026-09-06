# 📧 Bulk Mail App

> A full-stack MERN web application to send bulk emails to multiple recipients at once — with admin authentication, Excel/CSV upload, email logs, and a responsive dashboard UI.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel-black?style=for-the-badge&logo=vercel)](https://bulk-mail-app-liard-six.vercel.app/)
[![GitHub](https://img.shields.io/badge/GitHub-Repository-181717?style=for-the-badge&logo=github)](https://github.com/Ru942/Bulk-Mail-App)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

**🌐 Live Demo:** [bulk-mail-app-liard-six.vercel.app](https://bulk-mail-app-liard-six.vercel.app/)

---

## 📸 Screenshots

| Login | Dashboard |
|---|---|
| ![Login](https://private-user-images.githubusercontent.com/130793182/646878411-24cccfbf-b338-49ae-bf8f-b624caffcb95.png) | ![Dashboard](https://private-user-images.githubusercontent.com/130793182/646878468-39fdb3ed-66eb-47fc-9578-b4c8c15bec56.png) |

| Send Email | Email Logs |
|---|---|
| ![Send](https://private-user-images.githubusercontent.com/130793182/646878519-34fe6cfe-8686-4a6c-bb83-9669dbb5241a.png) | ![Logs](https://private-user-images.githubusercontent.com/130793182/646878538-e195856f-7914-4683-8784-2c7e4f0804dc.png) |

---

## ✨ Features

- 🔐 **Admin Login** — JWT-based authentication with secure 8-hour session
- 📨 **Bulk Email Sending** — Send emails to hundreds of recipients at once via Gmail SMTP
- 📁 **Excel / CSV Upload** — Upload a spreadsheet and auto-extract recipient email addresses
- ✍️ **Manual Email Entry** — Type or paste emails directly into the dashboard
- ✅ **Email Validation** — Automatically filters out invalid email addresses before sending
- 📋 **Email Logs** — View history of all sent and failed emails with timestamps
- 🗑️ **Clear Logs** — Delete all email logs with one click
- 📱 **Responsive UI** — Works on desktop and mobile devices

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| React 19 | UI framework |
| Tailwind CSS 4 | Styling |
| Vite | Build tool |
| Axios | HTTP requests |
| XLSX | Excel file parsing |

### Backend
| Technology | Purpose |
|---|---|
| Node.js | Runtime |
| Express 5 | Web framework |
| MongoDB + Mongoose | Database |
| Nodemailer | Gmail SMTP email sending |
| JSON Web Token | Authentication |
| dotenv | Environment variables |

### Deployment
| Service | Purpose |
|---|---|
| Vercel | Frontend + Backend (Serverless) |
| MongoDB Atlas | Cloud database |

---

## 📁 Project Structure

```
Bulk-Mail-App/
├── api/
│   └── index.js              # Express backend — Vercel serverless function
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/           # Images and icons
│   │   ├── App.js            # Main React component
│   │   ├── main.js           # React entry point
│   │   └── index.css         # Global styles
│   ├── index.html
│   ├── package.json
│   └── vite.config.js        # Vite + dev proxy config
├── .env.example              # Environment variable template
├── .gitignore                # Excludes .env and node_modules
├── package.json              # Backend dependencies
├── vercel.json               # Vercel deployment config
└── README.md
```

---

## 🚀 Getting Started Locally

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (free tier works)
- Gmail account with App Password enabled

### 1. Clone the repository
```bash
git clone https://github.com/Ru942/Bulk-Mail-App.git
cd Bulk-Mail-App
```

### 2. Install backend dependencies
```bash
npm install
```

### 3. Install frontend dependencies
```bash
cd frontend
npm install
cd ..
```

### 4. Set up environment variables
```bash
cp .env.example .env
```

Fill in your real values in `.env`:
```env
MONGO_URI=your-mongodb-atlas-connection-string
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=your-16-char-app-password
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-strong-password
JWT_SECRET=your-long-random-secret-key
```

> ⚠️ **Gmail App Password:** Go to [myaccount.google.com](https://myaccount.google.com) → Security → 2-Step Verification → App Passwords → Generate a 16-character password. Use that as `EMAIL_PASS`, NOT your real Gmail password.

### 5. Run the backend
```bash
node api/index.js
```

### 6. Run the frontend (new terminal)
```bash
cd frontend
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🌐 Deploying to Vercel

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → **Add New Project** → Import your GitHub repo
3. Add all environment variables under **Project Settings → Environment Variables**
4. Click **Deploy**

### Required Environment Variables on Vercel

| Variable | Description |
|---|---|
| `MONGO_URI` | MongoDB Atlas connection string |
| `EMAIL_USER` | Gmail address used to send emails |
| `EMAIL_PASS` | Gmail App Password (16 characters) |
| `ADMIN_USERNAME` | Login username for the dashboard |
| `ADMIN_PASSWORD` | Login password for the dashboard |
| `JWT_SECRET` | Secret key for JWT token signing |

---

## 📌 API Endpoints

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/auth/login` | Admin login, returns JWT token | ❌ |
| `POST` | `/api/sendemail` | Send bulk emails to recipients | ✅ |
| `GET` | `/api/logs` | Fetch last 100 email logs | ✅ |
| `DELETE` | `/api/logs` | Clear all email logs | ✅ |
| `GET` | `/api/health` | Backend health check | ❌ |

> All protected routes require `Authorization: Bearer <token>` header.

---

## 🔒 Security Notes

- Passwords are stored only in environment variables — never in code
- JWT tokens expire after 8 hours
- `.env` file is excluded from GitHub via `.gitignore`
- Email validation runs on both client and server side

---

## 👨‍💻 Author

**Rupesh K R**
- 🎓 B.Tech in Information Technology (2024)
- 💼 Resolution Coordinator at Walmart Global Tech
- 🌐 Transitioning into Full Stack Software Engineering (MERN)

[![GitHub](https://img.shields.io/badge/GitHub-Ru942-181717?style=flat&logo=github)](https://github.com/Ru942)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Rupesh%20K%20R-0077B5?style=flat&logo=linkedin)](https://www.linkedin.com/in/rupesh-k-r-70864a204)

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

⭐ If you found this useful, please consider giving it a star!
