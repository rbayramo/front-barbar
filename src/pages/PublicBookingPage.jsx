import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { format } from "date-fns";
import api from "../api/client";
import InternationalPhoneInput from "../components/InternationalPhoneInput";
import { isValidPhoneNumber } from "react-phone-number-input";
import { toUtcIso } from "../utils/time";

function getDayRange(date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

function minutesToHm(minutes) {
  const m = typeof minutes === "number" ? minutes : 0;
  const h = Math.floor(m / 60);
  const min = m % 60;
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

const STORAGE_KEY_PREFIX = "barberBookPublicPhone";

export default function PublicBookingPage() {
  const { barberId } = useParams();
  const [barber, setBarber] = useState(null);
  const [services, setServices] = useState([]);
  const [selectedServiceIds, setSelectedServiceIds] = useState([]);

  const [date, setDate] = useState(new Date());
  const [appointments, setAppointments] = useState([]);

  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [selectedSlotIso, setSelectedSlotIso] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // mövcud görüş üçün state-lər
  const [existingAppointment, setExistingAppointment] = useState(null);
  const [updatingAppointmentId, setUpdatingAppointmentId] = useState(null);

  // təsdiq pop-up üçün state-lər
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmData, setConfirmData] = useState(null);

  // form validation flag-lər
  const [missingName, setMissingName] = useState(false);
  const [missingPhone, setMissingPhone] = useState(false);
  const [missingServices, setMissingServices] = useState(false);
  const [missingSlot, setMissingSlot] = useState(false);

  // ümumi info/xəta popup (bottom-sheet)
  const [messageModal, setMessageModal] = useState(null); // { type: 'success' | 'error', message: string }

  const [bookingDisabled, setBookingDisabled] = useState(false);

  const storageKey = useMemo(
    () =>
      barberId ? `${STORAGE_KEY_PREFIX}:${barberId}` : null,
    [barberId]
  );

  // LocalStorage-dan telefon nömrəsini oxu (əvvəlki istifadə)
  useEffect(() => {
    if (!barberId || typeof window === "undefined") return;
    try {
      const stored = window.localStorage.getItem(
        `${STORAGE_KEY_PREFIX}:${barberId}`
      );
      if (stored) {
        setPhoneNumber(stored);
      }
    } catch (e) {
      // ignore
    }
  }, [barberId]);

  // Telefonu localStorage-a yaz
  useEffect(() => {
    if (!barberId || typeof window === "undefined") return;
    const key = `${STORAGE_KEY_PREFIX}:${barberId}`;
    try {
      if (phoneNumber && isValidPhoneNumber(phoneNumber)) {
        window.localStorage.setItem(key, phoneNumber);
      } else {
        window.localStorage.removeItem(key);
      }
    } catch (e) {
      // ignore
    }
  }, [phoneNumber, barberId]);

  // Bərbər məlumatı və xidmətlər
  useEffect(() => {
    if (!barberId) return;
    (async () => {
      setError("");
      try {
        const res = await api.get(`/public/barbers/${barberId}`);
        setBarber(res.data);
        const disabled = !!res.data.bookingDisabled;
        setBookingDisabled(disabled);
        setServices(disabled ? [] : res.data.services || []);
        if (disabled) {
          setMessageModal({
            type: "error",
            message: "Bu bərbər üçün onlayn rezervasiya hazırda aktiv deyil."
          });
        }
      } catch (err) {
        console.error("public barber load", err);
        setError("Bərbər səhifəsi tapılmadı.");
        setMessageModal({
          type: "error",
          message: "Bərbər səhifəsi tapılmadı."
        });
      }
    })();
  }, [barberId]);

  // Seçilən gün üçün mövcud görüşləri yüklə (calendar/saatlar üçün)
  useEffect(() => {
    if (!barberId || bookingDisabled) return;
    const { start, end } = getDayRange(date);
    (async () => {
      try {
        const res = await api.get(
          `/public/barbers/${barberId}/appointments`,
          {
            params: {
              from: start.toISOString(),
              to: end.toISOString()
            }
          }
        );
        setAppointments(res.data || []);
      } catch (err) {
        console.error("public appointments load", err);
      }
    })();
  }, [barberId, date, bookingDisabled]);

  // Eyni nömrə üçün növbəti gələcək görüşü backend-dən soruş
  useEffect(() => {
    if (!barberId || bookingDisabled) return;
    if (!phoneNumber || !isValidPhoneNumber(phoneNumber)) {
      setExistingAppointment(null);
      setUpdatingAppointmentId(null);
      return;
    }

    (async () => {
      try {
        const res = await api.get(
          `/public/barbers/${barberId}/appointments`,
          {
            params: {
              phone: phoneNumber
            }
          }
        );
        const list = res.data || [];
        const upcoming = list[0] || null;
        setExistingAppointment(upcoming);
        if (!upcoming) {
          setUpdatingAppointmentId(null);
        }
      } catch (err) {
        console.error("public appointments by phone load", err);
        setExistingAppointment(null);
        setUpdatingAppointmentId(null);
      }
    })();
  }, [barberId, phoneNumber, bookingDisabled]);

  const selectedServices = useMemo(
    () =>
      services.filter((s) =>
        selectedServiceIds.includes(String(s.id))
      ),
    [services, selectedServiceIds]
  );

  const totalDurationMinutes = useMemo(
    () =>
      selectedServices.reduce(
        (sum, s) => sum + (s.durationMinutes || 0),
        0
      ),
    [selectedServices]
  );

  const candidateSlots = useMemo(() => {
    if (!barber) return [];
    if (!totalDurationMinutes) return [];

    const startMinutes =
      typeof barber.workDayStartMinutes === "number"
        ? barber.workDayStartMinutes
        : 8 * 60;
    const endMinutes =
      typeof barber.workDayEndMinutes === "number"
        ? barber.workDayEndMinutes
        : 20 * 60;

    const slots = [];
    for (let m = startMinutes; m + totalDurationMinutes <= endMinutes; m += 30) {
      const d = new Date(date);
      const h = Math.floor(m / 60);
      const min = m % 60;
      d.setHours(h, min, 0, 0);
      slots.push(d);
    }
    return slots;
  }, [barber, date, totalDurationMinutes]);

  function slotIsFree(slotDate) {
    if (!totalDurationMinutes) return false;

    const now = new Date();
    // keçmiş saatlara rezervasiya etmə
    if (slotDate.getTime() < now.getTime()) {
      return false;
    }

    const slotEnd = new Date(
      slotDate.getTime() + totalDurationMinutes * 60 * 1000
    );

    return !appointments.some((a) => {
      const s = new Date(a.startTime);
      const e = a.endTime
        ? new Date(a.endTime)
        : new Date(s.getTime() + 30 * 60 * 1000);
      return slotDate < e && slotEnd > s;
    });
  }

  const slotsWithStatus = useMemo(
    () =>
      candidateSlots.map((d) => ({
        date: d,
        iso: d.toISOString(),
        available: slotIsFree(d)
      })),
    [candidateSlots, appointments, totalDurationMinutes]
  );

  function handleServiceToggle(id) {
    const strId = String(id);
    setSelectedServiceIds((prev) => {
      let next;
      if (prev.includes(strId)) {
        next = prev.filter((x) => x !== strId);
      } else {
        next = [...prev, strId];
      }
      if (missingServices && next.length > 0) {
        setMissingServices(false);
      }
      return next;
    });
    setSelectedSlotIso("");
  }

  function handleUseExistingAppointment() {
    if (!existingAppointment) return;

    // Tarixi həmin görüşə çək
    const start = new Date(existingAppointment.startTime);
    setDate(start);
    const slotIso = start.toISOString();
    setSelectedSlotIso(slotIso);
    setMissingSlot(false);

    // Mümkünsə xidmətləri də pre-select et
    const serviceIdsFromAppointment =
      existingAppointment.serviceIds ||
      (existingAppointment.services &&
        existingAppointment.services.map(
          (s) => s.serviceId || s.id
        ));

    if (
      Array.isArray(serviceIdsFromAppointment) &&
      serviceIdsFromAppointment.length
    ) {
      setSelectedServiceIds(
        serviceIdsFromAppointment.map((id) => String(id))
      );
      setMissingServices(false);
    }

    if (existingAppointment.name && !name) {
      setName(existingAppointment.name);
      setMissingName(false);
    }

    setUpdatingAppointmentId(
      existingAppointment._id || existingAppointment.id || null
    );
  }

  async function handleCancelAppointment() {
    if (
      !existingAppointment ||
      !phoneNumber ||
      !isValidPhoneNumber(phoneNumber)
    ) {
      return;
    }

    const confirmed = window.confirm(
      "Görüşü ləğv etmək istədiyinizə əminsiniz?"
    );
    if (!confirmed) return;

    try {
      setLoading(true);
      await api.post(`/public/barbers/${barberId}/cancel`, {
        appointmentId: existingAppointment.id || existingAppointment._id,
        phone: phoneNumber
      });
      const msg = "Görüşünüz ləğv edildi.";
      setSuccess(msg);
      setError("");
      setExistingAppointment(null);
      setUpdatingAppointmentId(null);
      setMessageModal({ type: "success", message: msg });

      // cari günün görüşlərini yenilə
      const { start, end } = getDayRange(date);
      const res = await api.get(
        `/public/barbers/${barberId}/appointments`,
        {
          params: {
            from: start.toISOString(),
            to: end.toISOString()
          }
        }
      );
      setAppointments(res.data || []);
    } catch (err) {
      console.error("public cancel error", err);
      const msg =
        err?.response?.data?.message ||
        "Görüşü ləğv etmək mümkün olmadı.";
      setError(msg);
      setMessageModal({ type: "error", message: msg });
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    setError("");
    setSuccess("");

    if (bookingDisabled) {
      const msg =
        "Bu bərbər üçün onlayn rezervasiya hazırda aktiv deyil.";
      setError(msg);
      setMessageModal({ type: "error", message: msg });
      return;
    }

    // field-level yoxlama
    const nameMissing = !name.trim();
    const phoneMissing = !phoneNumber || !isValidPhoneNumber(phoneNumber);
    const servicesMissing = !selectedServiceIds.length;
    const slotMissing = !selectedSlotIso;

    setMissingName(nameMissing);
    setMissingPhone(phoneMissing);
    setMissingServices(servicesMissing);
    setMissingSlot(slotMissing);

    if (nameMissing || phoneMissing || servicesMissing || slotMissing) {
      const msg = "Zəhmət olmasa qırmızı sahələri doldurun.";
      setError(msg);
      setMessageModal({ type: "error", message: msg });
      return;
    }

    try {
      setLoading(true);
      const startLocal = new Date(selectedSlotIso);
      const isUpdate = Boolean(updatingAppointmentId);

      await api.post(`/public/barbers/${barberId}/book`, {
        name: name.trim(),
        phone: phoneNumber,
        startTime: toUtcIso(startLocal),
        serviceIds: selectedServiceIds,
        existingAppointmentId: updatingAppointmentId || undefined
      });

      const servicesText = selectedServices.length
        ? selectedServices.map((s) => s.name).join(", ")
        : "";
      const timeText = format(startLocal, "dd.MM.yyyy HH:mm");

      setConfirmData({
        isUpdate,
        name: name.trim(),
        servicesText,
        timeText
      });
      setShowConfirmModal(true);

      // formu sıfırlayaq
      setName("");
    //   setPhoneDigits("");
      setSelectedServiceIds([]);
      setSelectedSlotIso("");
      setUpdatingAppointmentId(null);
      setMissingName(false);
      setMissingPhone(false);
      setMissingServices(false);
      setMissingSlot(false);
    //   setExistingAppointment(null);

      // yenidən günün görüşlərini yüklə
      const { start, end } = getDayRange(date);
      const res = await api.get(
        `/public/barbers/${barberId}/appointments`,
        {
          params: {
            from: start.toISOString(),
            to: end.toISOString()
          }
        }
      );
      setAppointments(res.data || []);

      try {
        if (phoneNumber && isValidPhoneNumber(phoneNumber)) {
          const resUpcoming = await api.get(
            `/public/barbers/${barberId}/appointments`,
            {
              params: {
                phone: phoneNumber
              }
            }
          );
          const list = resUpcoming.data || [];
          const upcoming = list[0] || null;
          setExistingAppointment(upcoming);
          if (!upcoming) {
            setUpdatingAppointmentId(null);
          }
        }
      } catch (err2) {
        console.error("reload upcoming after book", err2);
      }


    } catch (err) {
      console.error("public book error", err);
      const msg =
        err?.response?.data?.message ||
        "Rezervasiya yaratmaq mümkün olmadı.";
      setError(msg);
      setMessageModal({ type: "error", message: msg });
    } finally {
      setLoading(false);
    }
  }

  const dateInputValue = format(date, "yyyy-MM-dd");

  function handleDateChange(e) {
    const parts = e.target.value.split("-");
    if (parts.length === 3) {
      const d = new Date(
        Number(parts[0]),
        Number(parts[1]) - 1,
        Number(parts[2])
      );
      setDate(d);
      setSelectedSlotIso("");
      setMissingSlot(false);
    }
  }

  const hasUpcomingForBanner =
    !!existingAppointment &&
    phoneNumber &&
    isValidPhoneNumber(phoneNumber) &&
    !bookingDisabled;

  return (
    <div className="public-booking-shell">
      <header className="top-bar">
        <div className="top-bar-left">
          <div className="brand-mark">
            <div className="brand-mark-inner" />
          </div>
          <div className="brand-text-block">
            <div className="brand-name">BarberBook</div>
            <div className="top-bar-title">
              {barber?.shopName || "Salon"}
            </div>
            <div className="top-bar-subtitle">
              {barber?.name ? `${barber.name} – onlayn rezervasiya` : ""}
            </div>
          </div>
        </div>
      </header>

      <main className="public-booking-content">
        {!barber && !error && (
          <div className="screen-center">
            <div className="loader" />
          </div>
        )}

        {barber && bookingDisabled && (
          <section className="contacts-section" style={{ marginTop: 16 }}>
            <div className="section-header">
              <h2 className="section-title">Onlayn rezervasiya bağlıdır</h2>
            </div>
            <div className="empty-text">
              Bu bərbər üçün onlayn rezervasiya hazırda aktiv deyil.
              Zəhmət olmasa salonla birbaşa əlaqə saxlayın.
            </div>
          </section>
        )}

        {barber && !bookingDisabled && (
          <>
            {/* 1) Gələcək görüş kartı – SƏHİFƏNİN ÜSTÜNDƏ */}
            {hasUpcomingForBanner && (
              <section
                className="contacts-section"
                style={{
                  marginTop: 12,
                  marginBottom: 80,
                  borderRadius: 12,
                  border: "1px solid rgba(59,130,246,0.15)",
                  background: "rgba(59,130,246,0.06)",
                  padding: 12
                }}
              >
                <div className="section-header" style={{ marginBottom: 4 }}>
                  <h2
                    className="section-title"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8
                    }}
                  >
                    <span
                      style={{
                        display: "inline-flex",
                        width: 22,
                        height: 22,
                        borderRadius: "999px",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 13,
                        background: "var(--accent, #2563eb)",
                        color: "#fff"
                      }}
                    >
                      ✓
                    </span>
                    Gələcək görüşünüz var
                  </h2>
                </div>
                <div className="booking-summary">
                  <div className="booking-summary-main">
                    {existingAppointment.services &&
                    existingAppointment.services.length
                      ? existingAppointment.services
                          .map((s) => s.name)
                          .join(", ")
                      : "Xidmətlər"}
                  </div>
                  <div className="booking-summary-sub">
                    {format(
                      new Date(existingAppointment.startTime),
                      "dd.MM.yyyy HH:mm"
                    )}
                  </div>
                  {existingAppointment.name && (
                    <div
                      className="booking-summary-sub"
                      style={{ fontSize: 12, opacity: 0.9 }}
                    >
                      {existingAppointment.name} · {phoneNumber}
                    </div>
                  )}
                </div>
                <div
                  style={{
                    marginTop: 8,
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 8
                  }}
                >
                  <button
                    type="button"
                    className="primary-btn"
                    onClick={handleUseExistingAppointment}
                  >
                    Vaxtı / xidməti dəyiş
                  </button>
                  <button
                    type="button"
                    className="chip"
                    style={{
                      background: "#fff",
                      border: "1px solid rgba(15,23,42,0.12)"
                    }}
                    onClick={handleCancelAppointment}
                  >
                    Görüşü ləğv et
                  </button>
                </div>
                <div
                  style={{
                    marginTop: 6,
                    fontSize: 11,
                    color: "var(--text-muted)"
                  }}
                >
                  Yeni görüş yaratmaq üçün əvvəlcə mövcud görüşü yeniləyə
                  və ya ləğv edə bilərsiniz.
                </div>
              </section>
            )}

            {/* XİDMƏTLƏR */}
            <section className="contacts-section">
            <div className="section-header">
                <h2
                className="section-title"
                style={missingServices ? { color: "#ef4444" } : undefined}
                >
                Xidmət seçin
                </h2>
            </div>

            <div
                className={
                missingServices
                    ? "section-helper-text section-helper-text-error"
                    : "section-helper-text"
                }
            >
                Xidmət kartına toxunaraq seçin. Bir neçə xidməti eyni anda işarələyə bilərsiniz.
            </div>

            {services.length === 0 ? (
                <div className="empty-text small">
                Bu bərbər üçün hələ xidmətlər əlavə olunmayıb.
                </div>
            ) : (
                <div className="duration-chips">
                {services.map((s) => {
                    const id = String(s.id);
                    const isSelected = selectedServiceIds.includes(id);
                    return (
                    <button
                        key={id}
                        type="button"
                        className={isSelected ? "chip service-chip active" : "chip service-chip"}
                        onClick={() => handleServiceToggle(id)}
                    >
                        <span className="service-chip-check">
                        {isSelected ? "✓" : "+"}
                        </span>
                        <span className="service-chip-main">{s.name}</span>
                        <span className="service-chip-meta">
                        {s.price} ₼ · {s.durationMinutes} dəq
                        </span>
                    </button>
                    );
                })}
                </div>
            )}

            {totalDurationMinutes > 0 && (
                <div className="contact-frequency">
                Ümumi müddət: {totalDurationMinutes} dəqiqə
                </div>
            )}

            {missingServices && services.length > 0 && (
                <div className="error-text" style={{ marginTop: 6 }}>
                Zəhmət olmasa ən azı bir xidmət seçin.
                </div>
            )}
            </section>


            {/* TARİX & SAAT */}
            <section className="contacts-section" style={{ marginTop: 12 }}>
              <div className="section-header">
                <h2 className="section-title">Tarix və saat</h2>
              </div>

              <div className="field-row">
                <label className="field-label">Tarix</label>
                <input
                  type="date"
                  className="text-input full"
                  value={dateInputValue}
                  min={format(new Date(), "yyyy-MM-dd")}
                  onChange={handleDateChange}
                />
              </div>

              <div className="field-row" style={{ marginTop: 8 }}>
                <label
                  className="field-label"
                  style={missingSlot ? { color: "#ef4444" } : undefined}
                >
                  Saat
                </label>
                {!totalDurationMinutes && (
                  <div className="empty-text small">
                    Əvvəlcə xidmət seçin, sonra vaxtı seçə bilərsiniz.
                  </div>
                )}
                {totalDurationMinutes > 0 && (
                  <div className="duration-chips">
                    {slotsWithStatus.length === 0 && (
                      <div className="empty-text small">
                        Bu gün üçün uyğun boş vaxt yoxdur.
                      </div>
                    )}
                    {slotsWithStatus.map((slot) => {
                      const label = format(slot.date, "HH:mm");
                      const isSelected =
                        selectedSlotIso === slot.iso;
                      const className = slot.available
                        ? isSelected
                          ? "chip active"
                          : "chip"
                        : "chip booking-slot-disabled";
                      return (
                        <button
                          key={slot.iso}
                          type="button"
                          className={className}
                          disabled={!slot.available}
                          onClick={() => {
                            if (!slot.available) return;
                            setSelectedSlotIso(slot.iso);
                            if (missingSlot) {
                              setMissingSlot(false);
                            }
                          }}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>

            {/* MÜŞTƏRİ MƏLUMATI */}
            <section className="contacts-section" style={{ marginTop: 12 }}>
              <div className="section-header">
                <h2 className="section-title">Müştəri məlumatı</h2>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="field-row">
                  <label
                    className="field-label"
                    style={missingName ? { color: "#ef4444" } : undefined}
                  >
                    Ad
                  </label>
                  <input
                    className="text-input full"
                    style={missingName ? { borderColor: "#ef4444" } : undefined}
                    placeholder="Adınız"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (missingName && e.target.value.trim()) {
                        setMissingName(false);
                      }
                    }}
                  />
                </div>
                <div className="field-row">
                  <label
                    className="field-label"
                    style={missingPhone ? { color: "#ef4444" } : undefined}
                  >
                    Telefon nömrəsi
                  </label>
                  <InternationalPhoneInput
                    value={phoneNumber}
                    onChange={setPhoneNumber}
                    required
                  />
                </div>
              </form>
            </section>
          </>
        )}
      </main>

      {barber && !bookingDisabled && (
        <div className="booking-bottom-bar">
          <div className="booking-summary">
            <div className="booking-summary-main">
              {selectedServices.length
                ? selectedServices.map((s) => s.name).join(", ")
                : "Xidmət seçilməyib"}
            </div>
            <div className="booking-summary-sub">
              {totalDurationMinutes > 0 && (
                <>
                  {totalDurationMinutes} dəq ·{" "}
                  {selectedServices.reduce(
                    (sum, s) => sum + (s.price || 0),
                    0
                  )}{" "}
                  ₼
                </>
              )}
              {totalDurationMinutes === 0 && "Xidmət və vaxt seçin"}
            </div>
            {updatingAppointmentId && (
              <div
                className="booking-summary-sub"
                style={{ color: "var(--accent)" }}
              >
                Mövcud görüş yenilənəcək
              </div>
            )}
          </div>
          <button
            type="button"
            className="primary-btn"
            disabled={loading}
            onClick={handleSubmit}
          >
            {loading
              ? "Göndərilir..."
              : updatingAppointmentId
              ? "Görüşü yenilə"
              : "Rezervasiya et"}
          </button>
        </div>
      )}

      {/* Təsdiq pop-up (bottom-sheet) – nəticə (result) üçün */}
      {showConfirmModal && confirmData && (
        <div
          className="modal-backdrop"
          onClick={() => setShowConfirmModal(false)}
        >
          <div
            className="bottom-sheet"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sheet-header">
              <div className="sheet-title">
                {confirmData.isUpdate
                  ? "Görüş yeniləndi"
                  : "Görüş təsdiqləndi"}
              </div>
            </div>
            <div className="sheet-content">
              <div className="contacts-section">
                <div className="section-header">
                  <h2 className="section-title">
                    Təşəkkürlər, {confirmData.name}!
                  </h2>
                </div>
                <div className="booking-summary">
                  <div className="booking-summary-main">
                    {confirmData.servicesText || "Xidmətlər seçildi"}
                  </div>
                  <div className="booking-summary-sub">
                    {confirmData.timeText}
                  </div>
                </div>
                <div
                  style={{
                    marginTop: 8,
                    fontSize: 12,
                    color: "var(--text-muted)"
                  }}
                >
                  Görüşünüz BarberBook sistemində qeydə alındı.
                </div>
              </div>
            </div>
            <div className="sheet-footer">
              <button
                type="button"
                className="primary-btn full"
                onClick={() => setShowConfirmModal(false)}
              >
                Bağla
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Xəta və digər nəticələr üçün popup (bottom-sheet) */}
      {messageModal && (
        <div
          className="modal-backdrop"
          onClick={() => setMessageModal(null)}
        >
          <div
            className="bottom-sheet"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sheet-header">
              <div className="sheet-title">
                {messageModal.type === "error" ? "Xəta" : "Məlumat"}
              </div>
            </div>
            <div className="sheet-content">
              <div className="contacts-section">
                <div className="booking-summary">
                  <div className="booking-summary-main">
                    {messageModal.message}
                  </div>
                </div>
              </div>
            </div>
            <div className="sheet-footer">
              <button
                type="button"
                className="primary-btn full"
                onClick={() => setMessageModal(null)}
              >
                Bağla
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
