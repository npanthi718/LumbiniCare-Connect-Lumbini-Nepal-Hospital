# Lumbini Nepal Hospital — Backend

Express + MongoDB API powering the hospital management features.

## Tech Stack
- Node.js, Express
- MongoDB with Mongoose
- JWT auth
- CORS, compression

## Local Setup
1. `cd backend`
2. `npm install`
3. Create `.env`:
   - `PORT=5000`
   - `MONGO_URI=mongodb://127.0.0.1:27017/hms`
   - `FRONTEND_URL=http://localhost:5173`
   - `JWT_SECRET=your_secret`
4. `npm run dev` or `npm start`

## Routes
- `/api/auth` login/register
- `/api/users` user profile admin ops
- `/api/doctors` doctor profile and appointment completion
- `/api/patients` patient appointments/prescriptions
- `/api/appointments` appointment booking and queries
- `/api/prescriptions` prescriptions CRUD
- `/api/admin` admin dashboards, deletes for appointments/prescriptions
- `/health` service health check

## Policies
- Role-based middleware protects admin/doctor/patient paths
- Completed appointments cannot be cancelled
- Admin can delete appointments, prescriptions, users, and doctors

## Owner
- Name: Sushil Panthi
- Phone: +919359029905 / +9779823009467
- WhatsApp: +9779823009467
- Portfolio: https://www.sushilpanthi.com

