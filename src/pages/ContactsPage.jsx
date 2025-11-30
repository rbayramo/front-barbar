import React, { useEffect, useState } from "react";
import { format, differenceInCalendarDays } from "date-fns";
import TopBar from "../components/TopBar";
import BottomNav from "../components/BottomNav";
import api from "../api/client";
import InternationalPhoneInput from "../components/InternationalPhoneInput";
import { isValidPhoneNumber } from "react-phone-number-input";

export default function ContactsPage() {
  const [q, setQ] = useState("");
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", phoneNumber: "", note: "" });
  const [error, setError] = useState("");

  async function loadContacts(query) {
    setLoading(true);
    try {
      const res = await api.get("/customers", { params: { q: query || "" } });
      setContacts(res.data);
    } catch (err) {
      console.error("contacts page", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadContacts("");
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      loadContacts(q);
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  function openNew() {
    setEditing(null);
    setForm({ name: "", phoneNumber: "", note: "" });
    setError("");
    setSheetOpen(true);
  }

  function openEdit(contact) {
    setEditing(contact);
    setForm({
      name: contact.name || "",
      phoneNumber: contact.phone || "",
      note: contact.note || ""
    });
    setError("");
    setSheetOpen(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    setError("");

    if (!form.name.trim()) {
      setError("Ad boş ola bilməz.");
      return;
    }

    if (!form.phoneNumber || !isValidPhoneNumber(form.phoneNumber)) {
      setError("Telefon nömrəsi tam doldurulmalıdır.");
      return;
    }

    try {
      if (editing && editing._id) {
        await api.put(`/customers/${editing._id}`, {
          name: form.name.trim(),
          phone: form.phoneNumber,
          note: form.note
        });
      } else {
        await api.post("/customers", {
          name: form.name.trim(),
          phone: form.phoneNumber,
          note: form.note
        });
      }

      await loadContacts(q);
      setSheetOpen(false);
    } catch (err) {
      console.error("save contact", err);
      setError("Kontaktı yadda saxlamaq mümkün olmadı.");
    }
  }

  function buildLastVisitLabel(c) {
    if (!c.lastVisitAt) {
      return "Hələ ziyarət etməyib";
    }
    const d = new Date(c.lastVisitAt);
    return format(d, "d MMM yyyy");
  }

  function buildFrequencyLabel(c) {
    const visits = c.visitCount || 0;
    if (!c.lastVisitAt || !c.createdAt || visits <= 1) {
      return "Tezlik üçün kifayət qədər məlumat yoxdur";
    }
    const first = new Date(c.createdAt);
    const last = new Date(c.lastVisitAt);
    const daysTotal = Math.max(
      1,
      differenceInCalendarDays(last, first)
    );
    const perVisit = Math.max(1, Math.round(daysTotal / (visits - 1)));
    return `Təxmini: ${perVisit} gündən bir`;
  }

  return (
    <div className="app-shell">
      <TopBar title="Kontaktlar" />
      <div className="app-content">
        <div className="contacts-page-header">
          <input
            className="text-input full"
            placeholder="Ad və ya nömrə ilə axtar..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <button type="button" className="primary-btn" onClick={openNew}>
            Yeni kontakt
          </button>
        </div>

        <div className="contacts-list-page">
          {loading && <div className="empty-text">Yüklənir...</div>}

          {!loading &&
            contacts.map((c) => (
              <button
                key={c._id}
                type="button"
                className="contact-row contact-row-clickable"
                onClick={() => openEdit(c)}
              >
                <div className="avatar-circle">
                  {c.name
                    .split(" ")
                    .map((p) => p[0])
                    .join("")
                    .slice(0, 2)}
                </div>
                <div className="contact-main">
                  <div className="contact-name">{c.name}</div>
                  <div className="contact-phone">{c.phone}</div>
                  {c.note && <div className="contact-note">{c.note}</div>}
                  <div className="contact-meta-row">
                    <span className="contact-meta-pill">
                      Son ziyarət: {buildLastVisitLabel(c)}
                    </span>
                    <span className="contact-meta-pill">
                      Ziyarət sayı: {c.visitCount || 0}
                    </span>
                  </div>
                  <div className="contact-frequency">
                    {buildFrequencyLabel(c)}
                  </div>
                </div>
              </button>
            ))}

          {!loading && contacts.length === 0 && (
            <div className="empty-text">Hələ kontakt yoxdur.</div>
          )}
        </div>
      </div>

      <BottomNav />

      {sheetOpen && (
        <div className="modal-backdrop" onClick={() => setSheetOpen(false)}>
          <div
            className="bottom-sheet"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <div className="sheet-header">
              <div className="sheet-title">
                {editing ? "Kontakti redaktə et" : "Yeni kontakt"}
              </div>
              <button
                type="button"
                className="icon-button"
                onClick={() => setSheetOpen(false)}
              >
                ✕
              </button>
            </div>
            <div className="sheet-content">
              <div className="contact-form-card">
                <form onSubmit={handleSave}>
                  <div className="field-row">
                    <label className="field-label">Ad</label>
                    <input
                      className="text-input full"
                      value={form.name}
                      onChange={(e) =>
                        setForm({ ...form, name: e.target.value })
                      }
                    />
                  </div>
                  <div className="field-row">
                    <label className="field-label">Telefon nömrəsi</label>
                    <InternationalPhoneInput
                      value={form.phoneNumber}
                      onChange={(val) =>
                        setForm({ ...form, phoneNumber: val })
                      }
                    />
                  </div>
                  <div className="field-row">
                    <label className="field-label">Qeyd</label>
                    <textarea
                      className="text-input contact-note-textarea"
                      value={form.note}
                      onChange={(e) =>
                        setForm({ ...form, note: e.target.value })
                      }
                      rows={3}
                    />
                  </div>
                  {error && <div className="error-text">{error}</div>}
                  <div className="sheet-footer">
                    <button
                      type="button"
                      className="secondary-btn"
                      onClick={() => setSheetOpen(false)}
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
        </div>
      )}
    </div>
  );
}
