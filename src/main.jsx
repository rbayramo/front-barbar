// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./styles.css";

// Apply saved theme before React renders (same logic as old index.js)
const savedTheme = localStorage.getItem("bbTheme");
if (savedTheme === "dark") {
  document.body.classList.add("dark-theme");
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
