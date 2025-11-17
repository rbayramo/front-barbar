import React, { createContext, useEffect, useState } from "react";
import api from "../api/client";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [barber, setBarber] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadMe() {
    try {
      const token = localStorage.getItem("barberToken");
      if (!token) {
        setLoading(false);
        return;
      }
      const res = await api.get("/auth/me");
      setBarber(res.data);
    } catch (err) {
      console.error("loadMe error", err);
      localStorage.removeItem("barberToken");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMe();
  }, []);

  function login(token, barberInfo) {
    localStorage.setItem("barberToken", token);
    setBarber(barberInfo);
  }

  function logout() {
    localStorage.removeItem("barberToken");
    setBarber(null);
  }

  return (
    <AuthContext.Provider value={{ barber, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
