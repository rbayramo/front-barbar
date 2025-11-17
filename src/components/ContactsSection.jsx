import React, { useEffect, useState } from "react";
import api from "../api/client";

export default function ContactsSection() {
  const [q, setQ] = useState("");
  const [contacts, setContacts] = useState([]);

  async function loadContacts(query) {
    const res = await api.get("/customers", { params: { q: query || "" } });
    setContacts(res.data);
  }

  useEffect(() => {
    loadContacts("");
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      loadContacts(q).catch((err) => console.error("contacts", err));
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <section className="contacts-section">
      <div className="section-header">
        <h2 className="section-title">Kontaktlar</h2>
      </div>

      <input
        className="text-input full"
        placeholder="Ad və ya nömrə ilə axtar..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />

      <div className="contacts-list">
        {contacts.map((c) => (
          <div key={c._id} className="contact-row">
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
            </div>
          </div>
        ))}

        {contacts.length === 0 && (
          <div className="empty-text">Hələ kontakt yoxdur.</div>
        )}
      </div>
    </section>
  );
}
