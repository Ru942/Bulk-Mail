# 📧 Bulk Mail App

A full-stack web application to send bulk emails to multiple recipients at once — with admin authentication, Excel/CSV upload support, email logs, and a clean dashboard UI.

**Live Demo:** https://bulk-mail-app-liard-six.vercel.app/

**Github Link:** https://github.com/Ru942/Bulk-Mail-App

---

## ✨ Features

- 🔐 **Admin Login** — JWT-based authentication with secure session management
- 📨 **Bulk Email Sending** — Send emails to hundreds of recipients at once via Gmail SMTP
- 📁 **Excel / CSV Upload** — Upload a spreadsheet and auto-extract recipient email addresses
- ✍️ **Manual Email Entry** — Type or paste emails directly into the dashboard
- 📋 **Email Logs** — View history of all sent and failed emails with timestamps
- 🗑️ **Clear Logs** — Delete all email logs with one click
- ✅ **Email Validation** — Automatically filters out invalid email addresses
- 📱 **Responsive UI** — Works on desktop and mobile devices

---

## 🛠️ Tech Stack

### Frontend
- React 19
- Tailwind CSS 4
- Axios
- Vite
- XLSX (Excel parsing)

### Backend
- Node.js
- Express 5
- MongoDB + Mongoose
- Nodemailer (Gmail SMTP)
- JSON Web Token (JWT)

### Deployment
- Frontend + Backend → **Vercel** (Serverless)
- Database → **MongoDB Atlas**

---

## 📁 Project Structure

```
Bulk-Mail-App/
├── api/
│   └── index.js          # Express backend (Vercel serverless)
├── frontend/
│   ├── src/
│   │   ├── App.js        # Main React component
│   │   ├── main.js       # React entry point
│   │   └── index.css     # Global styles
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── .env.example           # Environment variable template
├── .gitignore
├── package.json
└── vercel.json            # Vercel deployment config
```

---

## 🚀 Getting Started Locally

### Prerequisites
- Node.js 18+
- MongoDB Atlas account
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
```
MONGO_URI=your-mongodb-atlas-connection-string
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=your-16-char-app-password
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-password
JWT_SECRET=your-secret-key
```

### 5. Run the backend
```bash
node api/index.js
```

### 6. Run the frontend (in a new terminal)
```bash
cd frontend
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🌐 Deploying to Vercel

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → Import your GitHub repo
3. Add all environment variables in Vercel project settings:
   - `MONGO_URI`
   - `EMAIL_USER`
   - `EMAIL_PASS`
   - `ADMIN_USERNAME`
   - `ADMIN_PASSWORD`
   - `JWT_SECRET`
4. Click Deploy — done!

---

## 📸 Screenshots

<img width="1917" height="866" alt="Screenshot 2026-09-06 120302" src="https://github.com/user-attachments/assets/24cccfbf-b338-49ae-bf8f-b624caffcb95" />

<img width="1917" height="862" alt="Screenshot 2026-09-06 120328" src="https://github.com/user-attachments/assets/39fdb3ed-66eb-47fc-9578-b4c8c15bec56" />

<img width="1917" height="867" alt="Screenshot 2026-09-06 120343" src="https://github.com/user-attachments/assets/34fe6cfe-8686-4a6c-bb83-9669dbb5241a" />

<img width="1917" height="868" alt="Screenshot 2026-09-06 120355" src="https://github.com/user-attachments/assets/e195856f-7914-4683-8784-2c7e4f0804dc" />


## 🔑 Environment Variables

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

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/api/auth/login` | Admin login | No |
| POST | `/api/sendemail` | Send bulk emails | Yes |
| GET | `/api/logs` | Get email logs | Yes |
| DELETE | `/api/logs` | Clear all logs | Yes |
| GET | `/api/health` | Health check | No |

---

## 👨‍💻 Author

**Rupesh K R**
- GitHub: [@Ru942](https://github.com/Ru942)
- LinkedIn: www.linkedin.com/in/rupesh-k-r-70864a204

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
