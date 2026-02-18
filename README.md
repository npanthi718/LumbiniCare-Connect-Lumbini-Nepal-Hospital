<div align="center">

<h1>🏥 Lumbini Nepal Hospital — MERN</h1>
<p><strong>Secure, fast, and elegant hospital management</strong></p>
<p>Admin • Doctor • Patient dashboards · Appointments · Prescriptions · Departments</p>

<a href="#features">✨ Features</a> ·
<a href="#quick-start">🚀 Quick Start</a> ·
<a href="#architecture">🧱 Architecture</a> ·
<a href="#docs">📘 Docs</a> ·
<a href="#owner">👤 Owner</a>

</div>

---

## ✨ Features

🔐 Role-based access for admin, doctor, patient

📅 Appointments: schedule, complete, cancel guards

💊 Prescriptions with medications/tests

🏢 Departments & doctor specialization

📩 Contact messages with admin actions

⚡ Splash loader + skeletons + sticky tabs

♿ Accessibility: inert + focus-safe global loader

---

## 🧱 Architecture

Backend (`/backend`) — Node.js + Express, MongoDB + Mongoose, JWT, compression

Folders and Files

- **`app.js`**: Application entry point.
- **`server.js`**: Configures and starts the server.
- **`middleware/`**: Custom middleware for authentication and admin access.
  - `admin.js`: Admin-specific middleware.
  - `auth.js`: Authentication middleware.
- **`models/`**: Mongoose models for MongoDB.
  - `appointment.model.js`: Appointment schema.
  - `contact.model.js`: Contact schema.
  - `department.model.js`: Department schema.
  - `doctor.model.js`: Doctor schema.
  - `prescription.model.js`: Prescription schema.
  - `user.model.js`: User schema.
- **`routes/`**: API routes
  - `admin.routes.js`: Admin-related routes.
  - `appointment.routes.js`: Appointment-related routes.
  - `auth.routes.js`: Authentication routes.
  - `contact.routes.js`: Contact-related routes.
  - `department.routes.js`: Department-related routes.
  - `doctor.routes.js`: Doctor-related routes.
  - `patient.routes.js`: Patient-related routes.
  - `prescription.routes.js`: Prescription-related routes.
  - `user.routes.js`: User-related routes.
- **`scripts/`**: Utility scripts for database operations.
- **`seeds/`**: Seed data for initializing the database.

#### 📦 **Backend Dependencies**

- **Express.js**: Web framework.
- **Mongoose**: MongoDB object modeling.
- **dotenv**: Environment variable management.
- **bcrypt**: Password hashing.
- **jsonwebtoken**: Token-based authentication.

---

Frontend (`/frontend`) — React + Vite, MUI, Router, Axios

#### 📁 **Folders and Files**

- **`public/`**: Static assets and HTML template.
- **`src/`**: React components, hooks, and utilities.
  - `components/`: Reusable UI components.
  - `pages/`: Page-level components for routing.
  - `hooks/`: Custom React hooks.
  - `services/`: API integration services.
  - `styles/`: CSS and styling files.
- **`package.json`**: Frontend dependencies and scripts.

Key dependencies: React 18 · MUI · Axios · Router v6 · Vite · notistack · date-fns

---

## 🚀 Quick Start

### **Prerequisites**

- **Node.js** (v14+)
- **MongoDB** (local or cloud instance)

Clone
```bash
git clone https://github.com/npanthi718/Lumbini-Nepal-Hospital--MERN-Stack-Project.git
cd "Hospital Management System Latest GitHUB"
```

Backend
```bash
cd backend
npm install
echo "PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/hms
JWT_SECRET=dev_secret
FRONTEND_URL=http://localhost:5173" > .env
npm run dev
```

Frontend
```bash
cd ../frontend
npm install
echo "VITE_API_BASE=http://localhost:5000/api" > .env
npm run dev
```

Open http://localhost:5173

---

## 🛠️ Dev Notes
- API base defaults to `/api`; set `VITE_API_BASE` to override.
- Global interceptors emit loading events for Splash/Backdrop.
- Protected routes guard role dashboards.

---

## 🧪 **Testing**

- Add tests as needed. Suggested:
- Backend: Jest + Supertest
- Frontend: React Testing Library

---

## 📽️ Demo Video
https://drive.google.com/file/d/1qe58qWPFIisWnKE3ICuby9QM5zIL5yTv/view?usp=sharing

---

## 🤝 Contributing
- Fork, branch, PR — welcome!

---

## 📜 License
MIT — see [LICENSE](LICENSE)

---

## 👤 Owner
- Name: Sushil Panthi
- Phone: +919359029905 / +9779823009467
- WhatsApp: +9779823009467
- Portfolio: https://www.sushilpanthi.com

---

### 📘 Docs
- Frontend: [frontend/README.md](frontend/README.md)
- Backend: [backend/README.md](backend/README.md)

---

## 🔐 Authentication & Roles

- Roles: `admin`, `doctor`, `patient`
- Protected routes ensure only authorized roles can access dashboards and profiles:
  - `/admin/dashboard`, `/admin/profile`
  - `/doctor/dashboard`, `/doctor/profile`
  - `/patient/dashboard`, `/patient/profile`
- The Home page remains the public landing. Use the Navbar’s Dashboard link to jump to your role’s dashboard after login.

## 👨‍⚕️ Admin: Creating Doctors

- Admin can create doctor accounts from Admin → Admin Actions.
- Required fields: name, unique email, password (≥ 6 chars), department, specialization, license, experience, consultation fee.
- Education entries need `degree`, `institution`, and `year` (number).
- Backend defaults availability to all 7 days to prevent validation failures.
- After creation, the doctor appears at the top of the Admin Doctors list (sorted newest-first).

## ⚙️ Environment & Proxy

- Frontend dev server runs on `5173` with Vite.
- API requests default to `/api` and are proxied to `http://localhost:5000` via `vite.config.mjs`.
- Optional: set `VITE_API_BASE` to override base URL (e.g., when deploying).

## 🧰 Troubleshooting

- If you see `Unchecked runtime.lastError: The message port closed…` in console, it’s likely a browser extension log; the app logs its own create/update messages separately.
- If API calls return 401, you’ll be redirected to `/login`. Ensure your token is valid.
- Use the Refresh button in Admin → Doctors to reload the latest list.
