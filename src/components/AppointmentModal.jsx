import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import api from "../api/client";
import PhoneInputAz from "./PhoneInputAz";
import { toUtcIso } from "../utils/time";

const DURATIONS = [15, 30, 45, 60, 120, 240];

export default function AppointmentModal({
  open,
  onClose,
  initialDate,
  appointment,
  onSaved
}) {
  const [date, setDate] = useState(initialDate || new Date());
  const [time, setTime] = useState("10:00");
  const [duration, setDuration] = useState(30);

  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const [createNew, setCreateNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhoneDigits, setNewPhoneDigits] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;

    if (appointment) {
      const startLocal = new Date(appointment.startTime);
      const endLocal = appointment.endTime
        ? new Date(appointment.endTime)
        : new Date(startLocal.getTime() + 30 * 60 * 1000);

      setDate(startLocal);
      setTime(format(startLocal, "HH:mm"));
      const diffMin = Math.round(
        (endLocal.getTime() - startLocal.getTime()) / (60 * 1000)
      );
      setDuration(diffMin || 30);
      if (appointment.customer) {
        setSelectedCustomer(appointment.customer);
      }
    } else if (initialDate) {
      setDate(initialDate);
      setTime(format(initialDate, "HH:mm"));
      setDuration(30);
      setSelectedCustomer(null);
    }

    setSearch("");
    setSearchResults([]);
    setCreateNew(false);
    setNewName("");
    setNewPhoneDigits("");
    setError("");
  }, [open, appointment, initialDate]);

  useEffect(() => {
    if (!search.trim()) {
      setSearchResults([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const res = await api.get("/customers", {
          params: { q: search }
        });
        setSearchResults(res.data || []);
      } catch (err) {
        console.error("search customers", err);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  if (!open) return null;

  function buildLocalStart() {
    const [h, m] = time.split(":").map((v) => parseInt(v, 10) || 0);
    const d = new Date(date);
    d.setHours(h, m, 0, 0);
    return d;
  }

  async function ensureCustomer() {
    if (selectedCustomer && selectedCustomer._id) {
      return selectedCustomer;
    }
    if (!createNew) {
      setError("Müştəri seçin və ya yeni müştəri yaradın.");
      return null;
    }
    if (!newName.trim()) {
      setError("Müştərinin adını yazın.");
      return null;
    }
    if (newPhoneDigits.length !== 9) {
      setError("Telefon nömrəsi tam doldurulmalıdır (9 rəqəm).");
      return null;
    }
    try {
      const phone = "+994" + newPhoneDigits;
      const res = await api.post("/customers", {
        name: newName.trim(),
        phone
      });
      return res.data;
    } catch (err) {
      console.error("create customer", err);
      setError("Yeni müştəri yaratmaq mümkün olmadı.");
      return null;
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    setError("");
    try {
      const customer = await ensureCustomer();
      if (!customer) return;

      const localStart = buildLocalStart();
      const localEnd = new Date(
        localStart.getTime() + duration * 60 * 1000
      );

      const payload = {
        startTime: toUtcIso(localStart),
        endTime: toUtcIso(localEnd),
        durationMinutes: duration,
        customerId: customer._id
      };

      if (appointment && appointment._id) {
        await api.put(`/appointments/${appointment._id}`, payload);
      } else {
        await api.post("/appointments", payload);
      }

      if (onSaved) onSaved();
      onClose();
    } catch (err) {
      console.error("save appointment", err);
      setError("Görüşü yadda saxlamaq mümkün olmadı.");
    }
  }

  const title = appointment ? "Görüşü redaktə et" : "Yeni görüş";

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="bottom-sheet"
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        <div className="sheet-header">
          <div className="sheet-title">{title}</div>
          <button type="button" className="icon-button" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="sheet-content">
          <form onSubmit={handleSave}>
            <div className="field-row">
              <label className="field-label">Tarix</label>
              <input
                type="date"
                className="text-input full"
                value={format(date, "yyyy-MM-dd")}
                onChange={(e) => {
                  const parts = e.target.value.split("-");
                  if (parts.length === 3) {
                    const d = new Date(
                      Number(parts[0]),
                      Number(parts[1]) - 1,
                      Number(parts[2])
                    );
                    setDate(d);
                  }
                }}
              />
            </div>

            <div className="field-row">
              <label className="field-label">Saat və müddət</label>
              <div className="time-row-inputs">
                <input
                  type="time"
                  className="text-input"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                />
                <span className="time-separator">·</span>
                <div className="duration-chips">
                  {DURATIONS.map((d) => (
                    <button
                      key={d}
                      type="button"
                      className={d === duration ? "chip active" : "chip"}
                      onClick={() => setDuration(d)}
                    >
                      {d} dəq
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="field-row">
              <label className="field-label">Müştəri</label>
              {selectedCustomer && !createNew && (
                <div className="selected-chip">
                  <span>{selectedCustomer.name}</span>
                  <span className="selected-meta">
                    {selectedCustomer.phone}
                  </span>
                  <button
                    type="button"
                    className="chip-remove"
                    onClick={() => setSelectedCustomer(null)}
                  >
                    ✕
                  </button>
                </div>
              )}

              {!selectedCustomer && !createNew && (
                <>
                  <input
                    className="text-input full"
                    placeholder="Ad və ya nömrə ilə axtar..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  {searchResults.length > 0 && (
                    <div className="search-results">
                      {searchResults.map((c) => (
                        <button
                          key={c._id}
                          type="button"
                          className="search-result"
                          onClick={() => {
                            setSelectedCustomer(c);
                            setSearch("");
                            setSearchResults([]);
                          }}
                        >
                          <div className="result-name">{c.name}</div>
                          <div className="result-phone">{c.phone}</div>
                        </button>
                      ))}
                    </div>
                  )}
                  <button
                    type="button"
                    className="create-new-row"
                    onClick={() => {
                      setCreateNew(true);
                      setSearch("");
                      setSearchResults([]);
                    }}
                  >
                    Yeni müştəri yarat
                  </button>
                </>
              )}

              {createNew && (
                <div className="new-contact-form">
                  <input
                    className="text-input full"
                    placeholder="Ad"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                  />
                  <PhoneInputAz
                    value={newPhoneDigits}
                    onChange={setNewPhoneDigits}
                  />
                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={() => {
                      setCreateNew(false);
                      setNewName("");
                      setNewPhoneDigits("");
                    }}
                  >
                    Geriyə
                  </button>
                </div>
              )}
            </div>

            {error && <div className="error-text">{error}</div>}

            <div className="sheet-footer">
              <button
                type="button"
                className="secondary-btn"
                onClick={onClose}
              >
                Bağla
              </button>
              <button type="submit" className="primary-btn">
                Yadda saxla
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
