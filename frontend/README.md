<div align="center">

<h2>🎨 Frontend — React + Vite + MUI</h2>
<p>Elegant UI, role dashboards, global loaders, and accessibility-first design</p>

</div>

---

## 🚀 Setup
```bash
cd frontend
npm install
echo "VITE_API_BASE=http://localhost:5000/api" > .env
npm run dev
```

Open http://localhost:5173

---

## 🧩 Highlights
- Role dashboards: Admin · Doctor · Patient
- Protected routes via AuthContext + ProtectedRoute
- SplashLoader during Suspense; Backdrop on API activity
- Appointments and prescriptions flows
- Patient re-book from completed appointments

---

## 📁 Structure
- `src/components` shared UI (Navbar, Layout, SplashLoader)
- `src/pages` route pages per role
- `src/services/api.js` axios instance + interceptors + prewarm
- `src/context/AuthContext.jsx` auth state

---

## ♿ Accessibility
- Global Backdrop uses `inert` to prevent focus within hidden content
- SplashLoader brings focus for assistive tech and announces loading

---

## 👤 Owner
- Name: Sushil Panthi
- Phone: +919359029905 / +9779823009467
- WhatsApp: +9779823009467
- Portfolio: https://www.sushilpanthi.com
