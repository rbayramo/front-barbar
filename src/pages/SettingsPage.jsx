// src/pages/SettingsPage.jsx
import React, {
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";
import TopBar from "../components/TopBar";
import BottomNav from "../components/BottomNav";
import api from "../api/client";
import { AuthContext } from "../context/AuthContext";
import TriggersScreen from "../components/TriggersScreen";

export default function SettingsPage() {
  const { barber, login } = useContext(AuthContext);

  const [activeTab, setActiveTab] = useState("profile");

  // Profile form
  const [profileForm, setProfileForm] = useState({
    shopName: "",
    phoneDigits: "",
    defaultDuration: 30,
    workDayStartMinutes: 8 * 60,
    workDayEndMinutes: 20 * 60
  });
  const [profileError, setProfileError] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);

  // Services
  const [services, setServices] = useState([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [serviceForm, setServiceForm] = useState({
    name: "",
    price: "",
    durationMinutes: ""
  });
  const [serviceError, setServiceError] = useState("");

  // Triggers
  const [triggers, setTriggers] = useState([]);
  const [triggerForm, setTriggerForm] = useState({
    type: "before_appointment",
    offsetValue: 1,
    message: ""
  });
  const [triggerError, setTriggerError] = useState("");

  // Public URL copy state
  const publicUrl = useMemo(() => {
    if (!barber || !barber.id) return "";
    const origin =
      typeof window !== "undefined"
        ? window.location.origin.replace(/\/$/, "")
        : "";
    return origin ? `${origin}/b/${barber.id}` : "";
  }, [barber]);

  const [copyStatus, setCopyStatus] = useState("");

  useEffect(() => {
    if (!barber) return;
    const numbers = (barber.phone || "").replace(/\D/g, "");
    const digits = numbers.startsWith("994") ? numbers.slice(3) : numbers;

    setProfileForm({
      shopName: barber.shopName || "",
      phoneDigits: digits,
      defaultDuration: barber.defaultDuration || 30,
      workDayStartMinutes:
        typeof barber.workDayStartMinutes === "number"
          ? barber.workDayStartMinutes
          : 8 * 60,
      workDayEndMinutes:
        typeof barber.workDayEndMinutes === "number"
          ? barber.workDayEndMinutes
          : 20 * 60
    });
  }, [barber]);

  useEffect(() => {
    // Xidmətləri əvvəlcədən yükləyək
    loadServices().catch((err) =>
      console.error("load services in settings", err)
    );
    // Triggerləri də yükləyirik
    loadTriggers().catch((err) =>
      console.error("load triggers in settings", err)
    );
  }, []);

  async function loadServices() {
    setServicesLoading(true);
    try {
      const res = await api.get("/services");
      setServices(res.data || []);
    } catch (err) {
      console.error("settings load services", err);
    } finally {
      setServicesLoading(false);
    }
  }

  async function loadTriggers() {
    try {
      const res = await api.get("/triggers");
      setTriggers(res.data || []);
    } catch (err) {
      console.error("settings load triggers", err);
    }
  }

  function handleProfileTimeChange(field, value) {
    const [hStr, mStr] = value.split(":");
    const h = parseInt(hStr || "0", 10);
    const m = parseInt(mStr || "0", 10);
    const total = h * 60 + m;
    setProfileForm((prev) => ({
      ...prev,
      [field]: total
    }));
  }

  function toTimeInputValue(minutes) {
    const safe = typeof minutes === "number" ? minutes : 0;
    const h = Math.floor(safe / 60)
      .toString()
      .padStart(2, "0");
    const m = (safe % 60).toString().padStart(2, "0");
    return `${h}:${m}`;
  }

  async function handleSaveProfile(e) {
    e.preventDefault();
    setProfileError("");

    if (!profileForm.shopName.trim()) {
      setProfileError("Salon adı tələb olunur.");
      return;
    }

    if (profileForm.phoneDigits.replace(/\D/g, "").length !== 9) {
      setProfileError(
        "Telefon nömrəsi tam doldurulmalıdır (9 rəqəm, +994 olmadan)."
      );
      return;
    }

    const payload = {
      shopName: profileForm.shopName.trim(),
      phone: "+994" + profileForm.phoneDigits.replace(/\D/g, ""),
      defaultDuration:
        Number(profileForm.defaultDuration) > 0
          ? Number(profileForm.defaultDuration)
          : 30,
      workDayStartMinutes: profileForm.workDayStartMinutes,
      workDayEndMinutes: profileForm.workDayEndMinutes
    };

    setProfileSaving(true);
    try {
      const res = await api.put("/auth/me", payload);
      // AuthContext-dəki bərbər məlumatını da yeniləyək
      const token = localStorage.getItem("barberToken");
      if (token && typeof login === "function") {
        login(token, res.data);
      }
    } catch (err) {
      console.error("save profile", err);
      const msg =
        err?.response?.data?.message ||
        "Ayarları yadda saxlamaq mümkün olmadı.";
      setProfileError(msg);
    } finally {
      setProfileSaving(false);
    }
  }

  function openNewService() {
    setEditingService(null);
    setServiceForm({
      name: "",
      price: "",
      durationMinutes: ""
    });
    setServiceError("");
    setServiceModalOpen(true);
  }

  function openEditService(service) {
    setEditingService(service);
    setServiceForm({
      name: service.name || "",
      price: String(service.price ?? ""),
      durationMinutes: String(service.durationMinutes ?? "")
    });
    setServiceError("");
    setServiceModalOpen(true);
  }

  async function handleSaveService(e) {
    e.preventDefault();
    setServiceError("");

    const name = serviceForm.name.trim();
    const price = Number(serviceForm.price);
    const duration = Number(serviceForm.durationMinutes);

    if (!name) {
      setServiceError("Xidmət adı tələb olunur.");
      return;
    }
    if (!price || price <= 0) {
      setServiceError("Qiymət düzgün daxil edilməyib.");
      return;
    }
    if (!duration || duration <= 0) {
      setServiceError("Müddət düzgün daxil edilməyib.");
      return;
    }

    try {
      if (editingService && editingService._id) {
        await api.put(`/services/${editingService._id}`, {
          name,
          price,
          durationMinutes: duration
        });
      } else {
        await api.post("/services", {
          name,
          price,
          durationMinutes: duration
        });
      }
      await loadServices();
      setServiceModalOpen(false);
    } catch (err) {
      console.error("save service", err);
      const msg =
        err?.response?.data?.message ||
        "Xidməti yadda saxlamaq mümkün olmadı.";
      setServiceError(msg);
    }
  }

  async function handleDeleteService(service) {
    if (!service || !service._id) return;
    try {
      await api.delete(`/services/${service._id}`);
      await loadServices();
    } catch (err) {
      console.error("delete service", err);
    }
  }

  async function handleSaveTrigger(e) {
    e.preventDefault();
    setTriggerError("");

    const type = triggerForm.type || "before_appointment";
    const offsetValue = Number(triggerForm.offsetValue) || 1;
    const message = (triggerForm.message || "").trim();

    if (!message) {
      setTriggerError("Mesaj mətni boş ola bilməz.");
      return;
    }

    let payload = {
      type,
      message,
      active: true
    };

    if (type === "before_appointment") {
      payload.offsetMinutes = offsetValue * 60;
    } else {
      payload.offsetDays = offsetValue;
    }

    try {
      await api.post("/triggers", payload);
      setTriggerForm({
        type,
        offsetValue,
        message: ""
      });
      await loadTriggers();
    } catch (err) {
      console.error("save trigger", err);
      const msg =
        err?.response?.data?.message ||
        "Qaydanı yadda saxlamaq mümkün olmadı.";
      setTriggerError(msg);
    }
  }

  async function handleToggleTrigger(trigger) {
    if (!trigger || !trigger._id) return;
    const payload = {
      type: trigger.type,
      message: trigger.message,
      active: !trigger.active
    };

    if (trigger.type === "before_appointment") {
      payload.offsetMinutes = trigger.offsetMinutes;
    } else if (trigger.type === "after_last_visit") {
      payload.offsetDays = trigger.offsetDays;
    }

    try {
      await api.put(`/triggers/${trigger._id}`, payload);
      await loadTriggers();
    } catch (err) {
      console.error("toggle trigger", err);
    }
  }

  async function handleDeleteTrigger(trigger) {
    if (!trigger || !trigger._id) return;
    try {
      await api.delete(`/triggers/${trigger._id}`);
      await loadTriggers();
    } catch (err) {
      console.error("delete trigger", err);
    }
  }

  async function handleCopyUrl() {
    if (!publicUrl) return;
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopyStatus("Link kopyalandı.");
      setTimeout(() => setCopyStatus(""), 2000);
    } catch (err) {
      console.error("copy url", err);
      setCopyStatus("Linki kopyalamaq alınmadı.");
      setTimeout(() => setCopyStatus(""), 2000);
    }
  }

  function handleSignOut() {
    try {
      localStorage.removeItem("barberToken");
    } catch (e) {
      // ignore
    }
    window.location.href = "/login";
  }

  return (
    <div className="app-shell">
      <TopBar title="Ayarlar" />
      <div className="app-content">
        <div className="settings-tabs">
          <button
            type="button"
            className={
              activeTab === "profile"
                ? "settings-tab active"
                : "settings-tab"
            }
            onClick={() => setActiveTab("profile")}
          >
            Salon
          </button>
          <button
            type="button"
            className={
              activeTab === "services"
                ? "settings-tab active"
                : "settings-tab"
            }
            onClick={() => setActiveTab("services")}
          >
            Xidmətlər
          </button>
          <button
            type="button"
            className={
              activeTab === "triggers"
                ? "settings-tab active"
                : "settings-tab"
            }
            onClick={() => setActiveTab("triggers")}
          >
            Avtomatik mesajlar
          </button>
        </div>

        {activeTab === "profile" && (
          <>
            {/* Public URL card */}
            <div className="settings-card">
              <div className="settings-card-header">
                <div className="settings-card-title">
                  Onlayn rezervasiya linki
                </div>
                <div className="settings-card-subtitle">
                  Bu linki müştərilərə göndərin, onlar login olmadan
                  online görüş yaza bilərlər.
                </div>
              </div>
              <div className="field-row">
                <label className="field-label">Publik link</label>
                <div className="public-link-row">
                  <input
                    className="text-input"
                    readOnly
                    value={publicUrl || ""}
                  />
                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={handleCopyUrl}
                    disabled={!publicUrl}
                  >
                    Kopyala
                  </button>
                </div>
                {copyStatus && (
                  <div className="helper-text">{copyStatus}</div>
                )}
              </div>
            </div>

            {/* Profile form */}
            <div className="settings-card">
              <div className="settings-card-header">
                <div className="settings-card-title">
                  Salon məlumatları
                </div>
                <div className="settings-card-subtitle">
                  Salon adını, əlaqə nömrəsini və iş saatlarını tənzimləyin.
                </div>
              </div>

              <form onSubmit={handleSaveProfile}>
                <div className="field-row">
                  <label className="field-label">Salon adı</label>
                  <input
                    className="text-input full"
                    value={profileForm.shopName}
                    onChange={(e) =>
                      setProfileForm((prev) => ({
                        ...prev,
                        shopName: e.target.value
                      }))
                    }
                  />
                </div>

                <div className="field-row">
                  <label className="field-label">Telefon nömrəsi</label>
                  <div className="phone-input-row">
                    <select
                      className="phone-country-select"
                      value="+994"
                      onChange={() => {}}
                    >
                      <option value="+994">
                        Azərbaycan (+994)
                      </option>
                    </select>
                    <input
                      className="phone-number-input"
                      type="tel"
                      value={profileForm.phoneDigits}
                      onChange={(e) =>
                        setProfileForm((prev) => ({
                          ...prev,
                          phoneDigits: e.target.value
                            .replace(/\D/g, "")
                            .slice(0, 9)
                        }))
                      }
                      placeholder="(__) ___ __ __"
                    />
                  </div>
                </div>

                <div className="field-row">
                  <label className="field-label">İş saatları</label>
/* START: simple 24h selects replacement */
<div className="work-hours-row">
  <div className="work-hours-item">
    <span>Başlanğıc</span>
    <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 6 }}>
      <select
        className="text-input"
        value={String(Math.floor(profileForm.workDayStartMinutes / 60)).padStart(2, "0")}
        onChange={(e) =>
          handleProfileTimeChange(
            "workDayStartMinutes",
            `${e.target.value}:${String(profileForm.workDayStartMinutes % 60).padStart(2, "0")}`
          )
        }
      >
        {Array.from({ length: 24 }).map((_, i) => {
          const hh = String(i).padStart(2, "0");
          return <option key={hh} value={hh}>{hh}</option>;
        })}
      </select>

      <select
        className="text-input"
        value={String(profileForm.workDayStartMinutes % 60).padStart(2, "0")}
        onChange={(e) =>
          handleProfileTimeChange(
            "workDayStartMinutes",
            `${String(Math.floor(profileForm.workDayStartMinutes / 60)).padStart(2, "0")}:${e.target.value}`
          )
        }
      >
        {["00", "15", "30", "45"].map((mm) => (
          <option key={mm} value={mm}>{mm}</option>
        ))}
      </select>
    </div>
  </div>

  <span className="time-separator" style={{ margin: "0 8px" }}>–</span>

  <div className="work-hours-item">
    <span>Bitmə</span>
    <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 6 }}>
      <select
        className="text-input"
        value={String(Math.floor(profileForm.workDayEndMinutes / 60)).padStart(2, "0")}
        onChange={(e) =>
          handleProfileTimeChange(
            "workDayEndMinutes",
            `${e.target.value}:${String(profileForm.workDayEndMinutes % 60).padStart(2, "0")}`
          )
        }
      >
        {Array.from({ length: 24 }).map((_, i) => {
          const hh = String(i).padStart(2, "0");
          return <option key={hh} value={hh}>{hh}</option>;
        })}
      </select>

      <select
        className="text-input"
        value={String(profileForm.workDayEndMinutes % 60).padStart(2, "0")}
        onChange={(e) =>
          handleProfileTimeChange(
            "workDayEndMinutes",
            `${String(Math.floor(profileForm.workDayEndMinutes / 60)).padStart(2, "0")}:${e.target.value}`
          )
        }
      >
        {["00", "15", "30", "45"].map((mm) => (
          <option key={mm} value={mm}>{mm}</option>
        ))}
      </select>
    </div>
  </div>
</div>
/* END: simple 24h selects replacement */

                </div>

                {profileError && (
                  <div className="error-text">{profileError}</div>
                )}

                <div className="sheet-footer">
                  <button
                    type="submit"
                    className="primary-btn"
                    disabled={profileSaving}
                  >
                    {profileSaving
                      ? "Yadda saxlanır..."
                      : "Ayarları yadda saxla"}
                  </button>
                </div>
              </form>
            </div>

            {/* Sign out card */}
            <div className="settings-card">
              <div className="settings-card-header">
                <div className="settings-card-title">Hesab</div>
                <div className="settings-card-subtitle">
                  Sistemdən çıxmaq üçün aşağıdakı düyməni istifadə edin.
                </div>
              </div>
              <button
                type="button"
                className="danger-outline-btn"
                onClick={handleSignOut}
              >
                Hesabdan çıx
              </button>
            </div>
          </>
        )}

        {activeTab === "services" && (
          <div className="settings-card">
            <div className="settings-card-header">
              <div className="settings-card-title">Xidmətlər</div>
              <div className="settings-card-subtitle">
                Məhsul (Saç, Saqqal, paket və s.) siyahısını idarə edin.
              </div>
            </div>

            <div className="settings-services-header">
              <button
                type="button"
                className="primary-btn"
                onClick={openNewService}
              >
                Yeni xidmət
              </button>
            </div>

            {servicesLoading && (
              <div className="empty-text small">Yüklənir...</div>
            )}

            {!servicesLoading && services.length === 0 && (
              <div className="empty-text small">
                Hələ xidmət yoxdur. “Yeni xidmət” düyməsi ilə əlavə edə
                bilərsiniz.
              </div>
            )}

            {!servicesLoading &&
              services.map((s) => (
                <div key={s._id} className="service-row">
                  <div className="service-main">
                    <div className="service-name">{s.name}</div>
                    <div className="service-meta">
                      <span className="service-pill">
                        {s.price} ₼
                      </span>
                      <span className="service-pill soft">
                        {s.durationMinutes} dəq
                      </span>
                    </div>
                  </div>
                  <div className="service-actions">
                    <button
                      type="button"
                      className="secondary-btn small"
                      onClick={() => openEditService(s)}
                    >
                      Redaktə et
                    </button>
                    <button
                      type="button"
                      className="danger-outline-btn small"
                      onClick={() => handleDeleteService(s)}
                    >
                      Sil
                    </button>
                  </div>
                </div>
              ))}

            {serviceModalOpen && (
              <div
                className="modal-backdrop"
                onClick={() => setServiceModalOpen(false)}
              >
                <div
                  className="bottom-sheet"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="sheet-header">
                    <div className="sheet-title">
                      {editingService
                        ? "Xidməti redaktə et"
                        : "Yeni xidmət"}
                    </div>
                    <button
                      type="button"
                      className="icon-button"
                      onClick={() => setServiceModalOpen(false)}
                    >
                      ✕
                    </button>
                  </div>
                  <div className="sheet-content">
                    <form onSubmit={handleSaveService}>
                      <div className="field-row">
                        <label className="field-label">
                          Xidmət adı
                        </label>
                        <input
                          className="text-input full"
                          value={serviceForm.name}
                          onChange={(e) =>
                            setServiceForm((prev) => ({
                              ...prev,
                              name: e.target.value
                            }))
                          }
                        />
                      </div>
                      <div className="field-row">
                        <label className="field-label">Qiymət (₼)</label>
                        <input
                          className="text-input"
                          type="number"
                          min={1}
                          value={serviceForm.price}
                          onChange={(e) =>
                            setServiceForm((prev) => ({
                              ...prev,
                              price: e.target.value
                            }))
                          }
                        />
                      </div>
                      <div className="field-row">
                        <label className="field-label">
                          Müddət (dəqiqə)
                        </label>
                        <input
                          className="text-input"
                          type="number"
                          min={5}
                          value={serviceForm.durationMinutes}
                          onChange={(e) =>
                            setServiceForm((prev) => ({
                              ...prev,
                              durationMinutes: e.target.value
                            }))
                          }
                        />
                      </div>

                      {serviceError && (
                        <div className="error-text">{serviceError}</div>
                      )}

                      <div className="sheet-footer">
                        <button
                          type="button"
                          className="secondary-btn"
                          onClick={() => setServiceModalOpen(false)}
                        >
                          Bağla
                        </button>
                        <button
                          type="submit"
                          className="primary-btn"
                        >
                          Yadda saxla
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "triggers" && (
          <TriggersScreen
            onBack={null}
            triggers={triggers}
            triggerForm={triggerForm}
            setTriggerForm={setTriggerForm}
            triggerError={triggerError}
            onSaveTrigger={handleSaveTrigger}
            onToggleTrigger={handleToggleTrigger}
            onDeleteTrigger={handleDeleteTrigger}
          />
        )}
      </div>
      <BottomNav />
    </div>
  );
}
