import React from "react";
import { NavLink } from "react-router-dom";

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="nav-icon-svg">
      <rect
        x="3"
        y="4"
        width="18"
        height="17"
        rx="2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M3 9h18"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M9 3v4M15 3v4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function DashboardIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="nav-icon-svg">
      <rect
        x="3"
        y="4"
        width="7"
        height="7"
        rx="1.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <rect
        x="14"
        y="4"
        width="7"
        height="5"
        rx="1.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <rect
        x="3"
        y="14"
        width="7"
        height="7"
        rx="1.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <rect
        x="14"
        y="11"
        width="7"
        height="10"
        rx="1.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />
    </svg>
  );
}

function ContactsIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="nav-icon-svg">
      <circle
        cx="9"
        cy="9"
        r="3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M4.5 18.5c.7-2.1 2.4-3.5 4.5-3.5s3.8 1.4 4.5 3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M16 7h4M16 11h3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function BottomNav() {
  return (
    <nav className="bottom-nav">
      <NavLink to="/" end className="bottom-nav-item">
        <div className="bottom-nav-inner">
          <span className="nav-icon">
            <CalendarIcon />
          </span>
          <span className="nav-label">Təqvim</span>
        </div>
      </NavLink>
      <NavLink to="/dashboard" className="bottom-nav-item">
        <div className="bottom-nav-inner">
          <span className="nav-icon">
            <DashboardIcon />
          </span>
          <span className="nav-label">Panel</span>
        </div>
      </NavLink>
      <NavLink to="/contacts" className="bottom-nav-item">
        <div className="bottom-nav-inner">
          <span className="nav-icon">
            <ContactsIcon />
          </span>
          <span className="nav-label">Kontaktlar</span>
        </div>
      </NavLink>
    </nav>
  );
}
