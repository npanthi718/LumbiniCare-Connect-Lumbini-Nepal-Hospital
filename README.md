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

- **React.js**: Frontend library.
- **Axios**: HTTP client for API requests.
- **React Router**: Routing for single-page applications.
- **Bootstrap**: Styling and responsive design.

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
     npm start
     ```

3. **Frontend Setup**:

   ```bash
   cd ../frontend
   npm install
   ```

   - Start the frontend development server:
     ```bash
     npm start
     ```

4. **Access the Application**:
   - Frontend: `http://localhost:3000`
   - Backend: `http://localhost:5000`

---

## 🛠️ **Development Workflow**

### **Backend**

- Add new models in the `models/` directory.
- Define API endpoints in the `routes/` directory.
- Use middleware from the `middleware/` directory for authentication and role-based access.

### **Frontend**

- Create new components in the `src/components/` directory.
- Use `Axios` for API integration.
- Manage state using React hooks or context.

---

## 🧪 **Testing**

- **Backend**: Use `Jest` and `Supertest` for unit and integration tests.
- **Frontend**: Use `React Testing Library` for component testing.

---

## 📽️ **Demo Video**

Watch the full demo of the **Hospital Management System** showcasing all features and functionalities:

[![Watch the Demo](https://drive.google.com/file/d/1qe58qWPFIisWnKE3ICuby9QM5zIL5yTv/view?usp=sharing)

Click the link above to view the video.

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

## 💬 **Contact**

For any inquiries or support, please contact us at **npanthi718@gmail.com**.

---

### 🌟 **Star this repository if you found it helpful!**
