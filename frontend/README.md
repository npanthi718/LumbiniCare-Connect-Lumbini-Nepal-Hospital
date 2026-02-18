# Lumbini Nepal Hospital — Frontend

This is a React + MUI frontend for Lumbini Nepal Hospital. It provides responsive dashboards for Admin, Doctor, and Patient roles with role-based routing and protected pages.

## Tech Stack
- React with React Router
- MUI (Material UI)
- Axios with global interceptors
- Code-splitting via React.lazy + Suspense

## Local Setup
1. `cd frontend`
2. `npm install`
3. Create `.env` and set:
   - `VITE_API_BASE=http://localhost:5000/api`
4. `npm run dev` to start the frontend.

## Key Features
- Role dashboards: `/admin/dashboard`, `/doctor/dashboard`, `/patient/dashboard`
- Protected routes with AuthContext
- Global loader and splash during lazy loads
- Appointments and prescriptions management
- Patient re-book flow from completed appointments

## Structure
- `src/components/` common UI
- `src/pages/` route pages
- `src/services/api.js` axios instance + loaders
- `src/context/AuthContext.jsx` authentication state

## Accessibility
- Splash and Backdrop manage focus and use `inert` during loads
- ARIA-friendly statuses and focus handling

## Owner
- Name: Sushil Panthi
- Phone: +919359029905 / +9779823009467
- WhatsApp: +9779823009467
- Portfolio: https://www.sushilpanthi.com

