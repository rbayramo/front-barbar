// src/components/ProtectedRoute.jsx
import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const ctx = useContext(AuthContext);

  // Əgər hər hansı səbəbdən AuthProvider tətbiqi sarmayıbsa,
  // context null olacaq – bu halda sadəcə login-ə yönləndiririk.
  if (!ctx) {
    return <Navigate to="/login" />;
  }

  const { barber, loading } = ctx;

  if (loading) {
    return (
      <div className="screen-center">
        <div className="loader" />
      </div>
    );
  }

  if (!barber) {
    return <Navigate to="/login" />;
  }

  return children;
}
