import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./styles.css";

// Apply saved theme before React renders
const savedTheme = localStorage.getItem("bbTheme");
if (savedTheme === "dark") {
  document.body.classList.add("dark-theme");
}

const container = document.getElementById("root");
const root = createRoot(container);
root.render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
