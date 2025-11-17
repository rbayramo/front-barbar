import React, { useState } from "react";
import { format } from "date-fns";
import api from "../api/client";

export default function AppointmentDetailsModal({
  open,
  appointment,
  onClose,
  onUpdated,
  onEdit
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!open || !appointment) return null;

  const startLocal = new Date(appointment.startTime);
  const endLocal = appointment.endTime
    ? new Date(appointment.endTime)
    : new Date(startLocal.getTime() + 30 * 60 * 1000);

  const statusCancelled = appointment.status === "cancelled";

  async function handleCancel() {
    if (statusCancelled) {
      onClose();
      return;
    }
    setLoading(true);
    setError("");
    try {
      await api.patch(`/appointments/${appointment._id}/cancel`);
      if (onUpdated) onUpdated();
      onClose();
    } catch (err) {
      console.error("cancel appointment", err);
      setError("Görüşü ləğv etmək mümkün olmadı.");
    } finally {
      setLoading(false);
    }
  }

  const customer = appointment.customer || {};
  const statusLabel = statusCancelled ? "Ləğv olunub" : "Aktiv";

  function handleEditClick() {
    if (onEdit) {
      onEdit(appointment);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="bottom-sheet"
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        <div className="sheet-header">
          <div className="sheet-title">Görüş detalları</div>
          <button type="button" className="icon-button" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="sheet-content">
          <div className="details-card">
            <div className="details-main-row">
              <div>
                <div className="details-name">
                  {customer.name || "Müştəri"}
                </div>
                {customer.phone && (
                  <div className="details-phone">{customer.phone}</div>
                )}
              </div>
              <div
                className={
                  statusCancelled ? "status-pill" : "status-pill status-active"
                }
              >
                {statusLabel}
              </div>
            </div>
            <div className="details-date">
              {format(startLocal, "d MMM yyyy, HH:mm")} –{" "}
              {format(endLocal, "HH:mm")}
            </div>
          </div>

          {error && <div className="error-text">{error}</div>}

          <div className="sheet-footer">
            {statusCancelled ? (
              <button
                type="button"
                className="secondary-btn full"
                onClick={onClose}
              >
                Bağla
              </button>
            ) : (
              <>
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={handleEditClick}
                  disabled={loading}
                >
                  Redaktə et
                </button>
                <button
                  type="button"
                  className="danger-outline-btn"
                  onClick={handleCancel}
                  disabled={loading}
                >
                  Görüşü ləğv et
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
