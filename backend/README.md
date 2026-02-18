<div align="center">

<h2>🧰 Backend — Express + MongoDB</h2>
<p>REST API for auth, appointments, prescriptions, departments, and admin ops</p>

</div>

## 🧱 Stack
- Node.js + Express
- MongoDB + Mongoose
- JWT auth, CORS, compression

## 🚀 Setup
```bash
cd backend
npm install
echo "PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/hms
FRONTEND_URL=http://localhost:5173
JWT_SECRET=dev_secret" > .env
npm run dev
```

## 📚 Routes
- `/api/auth` login/register
- `/api/users` user/admin profile ops
- `/api/doctors` doctor profile + appointment completion
- `/api/patients` appointments/prescriptions for patients
- `/api/appointments` booking and queries
- `/api/prescriptions` CRUD
- `/api/admin` admin dashboards + deletes
- `/health` health check

## 🔒 Policies
- Role middleware protects admin/doctor/patient paths
- Completed appointments cannot be cancelled
- Admin can delete appointments, prescriptions, users, and doctors

## 👤 Owner
- Name: Sushil Panthi
- Phone: +919359029905 / +9779823009467
- WhatsApp: +9779823009467
- Portfolio: https://www.sushilpanthi.com
