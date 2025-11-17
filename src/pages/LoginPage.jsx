import React, { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/client";
import { AuthContext } from "../context/AuthContext";
import PhoneInputAz from "../components/PhoneInputAz";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const [phoneDigits, setPhoneDigits] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (phoneDigits.length !== 9) {
      setError("Telefon nömrəsi tam doldurulmalıdır (9 rəqəm).");
      return;
    }

    try {
      const phone = "+994" + phoneDigits;
      const res = await api.post("/auth/login", { phone, password });
      login(res.data.token, res.data.barber);
      navigate("/");
    } catch (err) {
      setError("Telefon və ya şifrə yanlışdır.");
    }
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="auth-logo-circle">BB</div>
          <div className="auth-brand-text">
            <div className="auth-brand-name">BarberBook</div>
            <div className="auth-brand-tagline">
              Bərbərlər üçün ağıllı təqvim
            </div>
          </div>
        </div>

        <h1 className="auth-title">Xoş gəlmisiniz</h1>
        <p className="auth-subtitle">
          Günü və müştərilərinizi idarə etmək üçün daxil olun.
        </p>

        <form onSubmit={handleSubmit} className="auth-form">
          <label className="field-label">Telefon nömrəsi</label>
          <PhoneInputAz
            value={phoneDigits}
            onChange={setPhoneDigits}
            required
          />

          <label className="field-label">Şifrə</label>
          <input
            className="text-input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && <div className="error-text">{error}</div>}

          <button type="submit" className="primary-btn full">
            Daxil ol
          </button>
        </form>

        <div className="auth-footer-text">
          Hesabınız yoxdur? <Link to="/signup">Qeydiyyatdan keçin</Link>
        </div>
      </div>
    </div>
  );
}
