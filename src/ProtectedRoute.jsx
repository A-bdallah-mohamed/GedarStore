// src/components/ProtectedRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const user = JSON.parse(localStorage.getItem("user")); // The user stored after login

  if (!user) {
    // No user → redirect to login
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !user.Admin) {

    // User is not admin → redirect to home
    return <Navigate to="/" replace />;
  }

  // ✅ User exists and has permission
  return children;
};

export default ProtectedRoute;
