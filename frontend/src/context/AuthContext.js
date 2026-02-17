import React, { createContext, useState, useContext, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext(null);

// Create an axios instance with base URL
const api = axios.create({
  baseURL: "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
    }
    return Promise.reject(error);
  }
);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      const response = await api.get("/auth/me");
      if (response.data) {
        setUser(response.data);
      } else {
        setUser(null);
        localStorage.removeItem("token");
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      setUser(null);
      localStorage.removeItem("token");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (email, password) => {
    try {
      setError(null);
      console.log("Attempting login with:", { email });

      // Clear any existing token
      localStorage.removeItem("token");
      
      const response = await api.post("/auth/login", { email, password });
      console.log("Login response:", response.data);

      const { token, user: userData } = response.data;
      if (!token || !userData) {
        throw new Error("Invalid response from server");
      }

      // Store token and update headers
      localStorage.setItem("token", token);
      api.defaults.headers.Authorization = `Bearer ${token}`;

      // Set user state
      setUser(userData);
      return userData;
    } catch (error) {
      console.error("Login error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      setError(error.response?.data?.message || "Login failed");
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    delete api.defaults.headers.Authorization;
    setUser(null);
    window.location.href = "/login";
  };

  const register = async (userData) => {
    try {
      setError(null);
      const response = await api.post("/auth/register", userData);
      return response.data;
    } catch (error) {
      setError(error.response?.data?.message || "Registration failed");
      throw error;
    }
  };

  const updateProfile = async (profileData) => {
    try {
      setError(null);
      const response = await api.put("/users/profile", profileData);
      setUser(response.data);
      return response.data;
    } catch (error) {
      setError(error.response?.data?.message || "Profile update failed");
      throw error;
    }
  };

  const updatePassword = async (currentPassword, newPassword) => {
    try {
      setError(null);
      const response = await api.put("/auth/password", {
        currentPassword,
        newPassword
      });
      return response.data;
    } catch (error) {
      setError(error.response?.data?.message || "Password update failed");
      throw error;
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    register,
    checkAuth,
    updateProfile,
    updatePassword
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;
