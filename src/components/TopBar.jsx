// src/components/TopBar.jsx
import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

function SettingsIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="top-bar-settings-icon"
    >
      <circle
        cx="12"
        cy="12"
        r="3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M19 12a7 7 0 0 0-.09-1.1l2-1.55a0.7 0.7 0 0 0 .16-.9l-1.9-3.3a0.7 0.7 0 0 0-.86-.32l-2.35.94A7 7 0 0 0 13 4.1L12.7 2a0.7 0.7 0 0 0-.69-.6h-3a0.7 0.7 0 0 0-.69.6L7.99 4.1A7 7 0 0 0 5.94 5.77L3.6 4.83a0.7 0.7 0 0 0-.86.32l-1.9 3.3a0.7 0.7 0 0 0 .16.9l2 1.55A7 7 0 0 0 2.99 12c0 .37.03.73.09 1.1l-2 1.55a0.7 0.7 0 0 0-.16.9l1.9 3.3a0.7 0.7 0 0 0 .86.32l2.35-.94A7 7 0 0 0 8 19.9l.38 2.1a0.7 0.7 0 0 0 .69.6h3a0.7 0.7 0 0 0 .69-.6l.3-2.1a7 7 0 0 0 2.08-1.67l2.35.94a0.7 0.7 0 0 0 .86-.32l1.9-3.3a0.7 0.7 0 0 0-.16-.9l-2-1.55c.06-.36.09-.73.09-1.1Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function TopBar({ title, subtitle }) {
  const ctx = useContext(AuthContext);
  const navigate = useNavigate();

  // Əgər context hələ qurulmayıbsa, barber məlumatı yoxdur kimi davranırıq
  const barber = ctx?.barber;
  const displayName = barber?.name || barber?.shopName || "";

  return (
    <header className="top-bar">
      <div className="top-bar-left">
        <div className="brand-mark">
          <div className="brand-mark-inner" />
        </div>
        <div className="brand-text-block">
          <div className="brand-name">BarberBook</div>
          {title && <div className="top-bar-title">{title}</div>}
          {subtitle && <div className="top-bar-subtitle">{subtitle}</div>}
        </div>
      </div>

      <div className="top-bar-right">
        {displayName && (
          <div className="top-bar-user">
            <div className="top-bar-user-name">{displayName}</div>
            <button
              type="button"
              className="top-bar-settings-btn"
              onClick={() => navigate("/settings")}
              aria-label="Ayarlar"
            >
              <SettingsIcon />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
