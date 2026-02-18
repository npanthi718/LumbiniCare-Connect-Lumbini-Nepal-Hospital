# 🏥 **Hospital Management System**

Welcome to the **Hospital Management System**, a comprehensive full-stack web application designed to streamline hospital operations and enhance patient care. Built with a powerful **Node.js** backend and a dynamic **React.js** frontend, this system ensures a seamless experience for administrators, doctors, and patients alike.

---

## 🌟 **Key Features**

✨ **User Management**  
Effortlessly manage patients, doctors, and admin users with role-based access control.

✨ **Appointments**  
Schedule, update, and track appointments with ease.

✨ **Prescriptions**  
Generate and manage prescriptions for patients.

✨ **Departments**  
Organize and manage hospital departments efficiently.

✨ **Contact Management**  
Handle inquiries and feedback from users.

✨ **Authentication**  
Secure login with JWT-based authentication and role-based access.

✨ **Admin Dashboard**  
A comprehensive dashboard with tools for administrators to monitor and manage hospital operations.

---

## 🗂️ **Project Structure**

### **Backend** (`/backend`)

The backend is powered by **Node.js** and **Express.js**, providing RESTful APIs for the frontend.

#### 📁 **Folders and Files**

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
- **`routes/`**: API routes for different modules.
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

### **Frontend** (`/frontend`)

The frontend is built with **React.js**, offering a responsive and user-friendly interface.

#### 📁 **Folders and Files**

- **`public/`**: Static assets and HTML template.
- **`src/`**: React components, hooks, and utilities.
  - `components/`: Reusable UI components.
  - `pages/`: Page-level components for routing.
  - `hooks/`: Custom React hooks.
  - `services/`: API integration services.
  - `styles/`: CSS and styling files.
- **`package.json`**: Frontend dependencies and scripts.

#### 📦 **Frontend Dependencies**

- **React 18**: Modern SPA framework.
- **MUI**: Component library for a polished UI.
- **Axios**: HTTP client with interceptors.
- **React Router v6**: Declarative routing.
- **Vite**: Fast dev server and build tool.
- **notistack**: Snackbars for user feedback.
- **date-fns**: Date utilities.

---

## 🚀 **Getting Started**

### **Prerequisites**

- **Node.js** (v14+)
- **MongoDB** (local or cloud instance)

### **Installation**

1. **Clone the repository**:

   ```bash
   git clone https://github.com/npanthi718/Lumbini-Nepal-Hospital--MERN-Stack-Project.git
   cd hospital-management-system
   ```

2. **Backend Setup**:

   ```bash
   cd backend
   npm install
   ```

   - Create a `.env` file in the `backend` directory:

     ```
     PORT=5000
     MONGO_URI=your_mongodb_connection_string
     JWT_SECRET=your_jwt_secret
     ```

   - Start the backend server:
     ```bash
     npm run dev
     ```

3. **Frontend Setup**:

   ```bash
   cd ../frontend
   npm install
   ```

   - Start the frontend development server:
     ```bash
     npm run dev
     ```

4. **Access the Application**:
   - Frontend (Vite): `http://localhost:5173`
   - Backend (Express): `http://localhost:5000`

---

## 🛠️ **Development Workflow**

### **Backend**

- Add new models in the `models/` directory.
- Define API endpoints in the `routes/` directory.
- Use middleware from the `middleware/` directory for authentication and role-based access.

### **Frontend**

- Create new components in the `src/components/` directory.
- API base URL defaults to `/api` and proxies to backend port `5000` in dev.
- Manage auth via `AuthContext` and interceptors in `src/services/api.js`.
- Role-based routes are protected using `components/ProtectedRoute.jsx`.

---

## 🧪 **Testing**

- Add tests as needed. Suggested:
- Backend: Jest + Supertest
- Frontend: React Testing Library

---

## 📽️ **Demo Video**

Watch the full demo of the **Hospital Management System** showcasing all features and functionalities:

Watch the demo on Google Drive:  
https://drive.google.com/file/d/1qe58qWPFIisWnKE3ICuby9QM5zIL5yTv/view?usp=sharing

---

## 🤝 **Contributing**

We welcome contributions! Please follow these steps:

1. Fork the repository.
2. Create a new branch (`feature/your-feature`).
3. Commit your changes.
4. Open a pull request.

---

## 📜 **License**

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.

---

## 💬 **Owner & Contact**

**Owner:** Sushil Panthi  
**Phone:** +919359029905 / +9779823009467  
**WhatsApp:** +9779823009467  
**Web Portfolio:** https://www.sushilpanthi.com

---

### 🌟 **Star this repository if you found it helpful!**

### 📘 Additional READMEs
- Frontend docs: [frontend/README.md](frontend/README.md)
- Backend docs: [backend/README.md](backend/README.md)

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
