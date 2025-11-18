import axios from "axios";

const api = axios.create({
  // baseURL: "http://localhost:5000/api",
  baseURL: "https://ff228a002863.ngrok-free.app/api",
  withCredentials: false
});

// always attach token
api.interceptors.request.use((config) => {
  // IMPORTANT: use the same key as AuthContext
  const token = localStorage.getItem("barberToken");
  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  config.headers["ngrok-skip-browser-warning"] = "true";
  return config;
});

export default api;
