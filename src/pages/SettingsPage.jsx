import React, { useContext, useEffect, useState } from "react";
import TopBar from "../components/TopBar";
import BottomNav from "../components/BottomNav";
import api from "../api/client";
import { AuthContext } from "../context/AuthContext";
import PhoneInputAz from "../components/PhoneInputAz";
import TriggersScreen from "../components/TriggersScreen";

export default function SettingsPage() {
  const { barber, logout } = useContext(AuthContext);
  const [form, setForm] = useState({
    shopName: "",
    phoneDigits: "",
    defaultDuration: 30
  });
  const [theme, setTheme] = useState("light");

  const [triggers, setTriggers] = useState([]);
  const [triggerForm, setTriggerForm] = useState({
    type: "before_appointment",
    offsetValue: 3,
    message: ""
  });
  const [triggerError, setTriggerError] = useState("");

  const [activeSettingsView, setActiveSettingsView] = useState("main");

  useEffect(() => {
    if (!barber) return;

    const numbers = (barber.phone || "").replace(/\D/g, "");
    const localDigits = numbers.startsWith("994") ? numbers.slice(3) : numbers;

    setForm({
      shopName: barber.shopName || "",
      phoneDigits: localDigits,
      defaultDuration: barber.defaultDuration || 30
    });
  }, [barber]);

  useEffect(() => {
    const saved = localStorage.getItem("bbTheme") || "light";
    setTheme(saved);
    document.body.classList.toggle("dark-theme", saved === "dark");
  }, []);

  useEffect(() => {
    if (!barber) return;
    loadTriggers();
  }, [barber]);

  async function loadTriggers() {
    try {
      const res = await api.get("/triggers");
      setTriggers(res.data || []);
    } catch (err) {
      console.error("load triggers", err);
    }
  }

  async function handleSave(e) {
    e.preventDefault();

    if (form.phoneDigits.length !== 0 && form.phoneDigits.length !== 9) {
      alert("Telefon nömrəsi tam doldurulmalıdır (9 rəqəm) və ya boş buraxın.");
      return;
    }

    try {
      const phone =
        form.phoneDigits.length === 9 ? "+994" + form.phoneDigits : "";

      await api.put("/auth/me", {
        shopName: form.shopName,
        phone,
        defaultDuration: form.defaultDuration
      });
      alert("Yadda saxlandı.");
    } catch (err) {
      console.error("save settings", err);
      alert("Yadda saxlamaq mümkün olmadı.");
    }
  }

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("bbTheme", next);
    document.body.classList.toggle("dark-theme", next === "dark");
  }

  async function handleTriggerSave(e) {
    e.preventDefault();
    setTriggerError("");

    if (!triggerForm.message.trim()) {
      setTriggerError("Mesaj mətni boş ola bilməz.");
      return;
    }

    try {
      if (triggerForm.type === "before_appointment") {
        await api.post("/triggers", {
          type: "before_appointment",
          offsetMinutes: triggerForm.offsetValue * 60,
          message: triggerForm.message,
          active: true
        });
      } else {
        await api.post("/triggers", {
          type: "after_last_visit",
          offsetDays: triggerForm.offsetValue,
          message: triggerForm.message,
          active: true
        });
      }

      setTriggerForm({
        ...triggerForm,
        message: ""
      });
      await loadTriggers();
    } catch (err) {
      console.error("save trigger", err);
      setTriggerError("Triggeri yadda saxlamaq mümkün olmadı.");
    }
  }

  async function toggleTriggerActive(trigger) {
    try {
      await api.put(`/triggers/${trigger._id}`, {
        type: trigger.type,
        message: trigger.message,
        active: !trigger.active,
        offsetMinutes: trigger.offsetMinutes,
        offsetDays: trigger.offsetDays
      });
      await loadTriggers();
    } catch (err) {
      console.error("toggle trigger", err);
    }
  }

  async function deleteTrigger(trigger) {
    if (!window.confirm("Bu triggeri silmək istədiyinizə əminsiniz?")) {
      return;
    }
    try {
      await api.delete(`/triggers/${trigger._id}`);
      await loadTriggers();
    } catch (err) {
      console.error("delete trigger", err);
    }
  }

  if (!barber) return null;

  const initials = barber.name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2);

  const activeTriggersCount = triggers.filter((t) => t.active).length;
  const activeTriggersLabel =
    activeTriggersCount === 0
      ? "Aktiv qayda yoxdur"
      : activeTriggersCount === 1
      ? "1 aktiv qayda"
      : activeTriggersCount + " aktiv qayda";

  return (
    <div className="app-shell">
      <TopBar title="Ayarlar" />
      <div className="app-content">
        {activeSettingsView === "main" && (
          <>
            <div className="profile-card">
              <div className="avatar-large">{initials}</div>
              <div className="profile-name">{barber.shopName}</div>
              <div className="profile-plan">
                Plan:
                <span
                  className={
                    barber.isPaid ? "plan-pill paid" : "plan-pill free"
                  }
                >
                  {barber.isPaid ? "Ödənişli" : "Ödənişsiz"}
                </span>
              </div>
            </div>

            <div className="theme-toggle-row">
              <div>
                <div className="theme-toggle-title">Görünüş</div>
                <div className="theme-toggle-subtitle">
                  İşıqlı və qaranlıq rejim arasında keçid edin.
                </div>
              </div>
              <button
                type="button"
                className="secondary-btn"
                onClick={toggleTheme}
              >
                {theme === "dark" ? "İşıqlı rejim" : "Qaranlıq rejim"}
              </button>
            </div>

            {/* Modern settings navigation row for triggers */}
            <div className="settings-nav-list">
              <button
                type="button"
                className="settings-nav-item"
                onClick={() => setActiveSettingsView("triggers")}
              >
                <div className="settings-nav-icon-badge">
                  <span aria-hidden="true">⚡</span>
                </div>
                <div className="settings-nav-text">
                  <div className="settings-nav-label-row">
                    <div className="settings-nav-label">Avtomatik mesajlar</div>
                    <div className="settings-nav-pill">
                      {activeTriggersLabel}
                    </div>
                  </div>
                  <div className="settings-nav-description">
                    Görüşdən əvvəl və sonra WhatsApp xatırlatmaları.
                  </div>
                </div>
                <div className="settings-nav-chevron" aria-hidden="true">
                  ›
                </div>
              </button>
            </div>

            <form className="settings-form" onSubmit={handleSave}>
              <label className="field-label">Salonun adı</label>
              <input
                className="text-input"
                value={form.shopName}
                onChange={(e) =>
                  setForm({ ...form, shopName: e.target.value })
                }
              />

              <label className="field-label">Telefon nömrəsi</label>
              <PhoneInputAz
                value={form.phoneDigits}
                onChange={(val) =>
                  setForm({ ...form, phoneDigits: val })
                }
              />

              <label className="field-label">
                Varsayılan görüş müddəti (dəq)
              </label>
              <select
                className="text-input"
                value={form.defaultDuration}
                onChange={(e) =>
                  setForm({
                    ...form,
                    defaultDuration: Number(e.target.value)
                  })
                }
              >
                <option value={15}>15 dəq</option>
                <option value={30}>30 dəq</option>
                <option value={45}>45 dəq</option>
                <option value={60}>60 dəq</option>
                <option value={120}>120 dəq</option>
                <option value={240}>240 dəq</option>
              </select>

              <button type="submit" className="primary-btn full">
                Yadda saxla
              </button>
            </form>

            <button
              type="button"
              className="danger-outline-btn full mt-16"
              onClick={logout}
            >
              Hesabdan çıx
            </button>
          </>
        )}

        {activeSettingsView === "triggers" && (
          <TriggersScreen
            onBack={() => setActiveSettingsView("main")}
            triggers={triggers}
            triggerForm={triggerForm}
            setTriggerForm={setTriggerForm}
            triggerError={triggerError}
            onSaveTrigger={handleTriggerSave}
            onToggleTrigger={toggleTriggerActive}
            onDeleteTrigger={deleteTrigger}
          />
        )}
      </div>
      <BottomNav />
    </div>
  );
}
