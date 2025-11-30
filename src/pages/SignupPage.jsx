import React, { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/client";
import { AuthContext } from "../context/AuthContext";
import InternationalPhoneInput from "../components/InternationalPhoneInput";
import { isValidPhoneNumber } from "react-phone-number-input";

export default function SignupPage() {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const [name, setName] = useState("");
  const [shopName, setShopName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!phoneNumber || !isValidPhoneNumber(phoneNumber)) {
      setError("Telefon nömrəsi tam doldurulmalıdır.");
      return;
    }

    try {
      const res = await api.post("/auth/signup", {
        name,
        shopName,
        phone: phoneNumber,
        password
      });
      login(res.data.token, res.data.barber);
      navigate("/");
    } catch (err) {
      setError("Hesab yaratmaq mümkün olmadı.");
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

        <h1 className="auth-title">Yeni hesab yaradın</h1>
        <p className="auth-subtitle">
          Qəbul və müştərilərinizi bir yerdə izləməyə başlayın.
        </p>

        <form onSubmit={handleSubmit} className="auth-form">
          <label className="field-label">Adınız</label>
          <input
            className="text-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <label className="field-label">Salonun adı</label>
          <input
            className="text-input"
            value={shopName}
            onChange={(e) => setShopName(e.target.value)}
          />

          <label className="field-label">Telefon nömrəsi</label>
          <InternationalPhoneInput
            value={phoneNumber}
            onChange={setPhoneNumber}
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
            Hesab yarat
          </button>
        </form>

        <div className="auth-footer-text">
          Artıq hesabınız var? <Link to="/login">Daxil olun</Link>
        </div>
      </div>
    </div>
  );
}
