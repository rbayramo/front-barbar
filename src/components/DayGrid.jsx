import React from "react";
import { format, isSameDay } from "date-fns";

function buildSlots() {
  const slots = [];
  for (let h = 8; h < 20; h++) {
    slots.push({ hour: h, minute: 0 });
    slots.push({ hour: h, minute: 30 });
  }
  return slots;
}

const SLOTS = buildSlots();
const SLOT_MINUTES = 30;

export default function DayGrid({
  date,
  appointments,
  onEmptySlotClick,
  onAppointmentClick
}) {
  function slotTime(slot) {
    const d = new Date(date);
    d.setHours(slot.hour, slot.minute, 0, 0);
    return d;
  }

  function findAppointmentAt(slotDate) {
    return appointments.find((a) => {
      const startLocal = new Date(a.startTime);
      const endLocal = a.endTime
        ? new Date(a.endTime)
        : new Date(startLocal.getTime() + 30 * 60 * 1000);

      return (
        isSameDay(startLocal, date) &&
        slotDate >= startLocal &&
        slotDate < endLocal
      );
    });
  }

  return (
    <div className="day-grid-card">
      {SLOTS.map((slot) => {
        const d = slotTime(slot);
        const appt = findAppointmentAt(d);
        const label = format(d, "HH:mm");
        const hasAppointment = Boolean(appt);

        let isFirst = false;
        let isLast = false;
        let isSingle = false;
        let customerName = "";
        let customerPhone = "";
        let startLabel = "";
        let endLabel = "";

        if (hasAppointment) {
          const startLocal = new Date(appt.startTime);
          const endLocal = appt.endTime
            ? new Date(appt.endTime)
            : new Date(startLocal.getTime() + SLOT_MINUTES * 60 * 1000);

          const slotStart = d;
          const slotEnd = new Date(
            slotStart.getTime() + SLOT_MINUTES * 60 * 1000
          );

          isFirst =
            startLocal.getHours() === slotStart.getHours() &&
            startLocal.getMinutes() === slotStart.getMinutes();

          // if this row ends at or after appointment end, treat as last row
          isLast = slotEnd >= endLocal && slotStart < endLocal;

          isSingle = isFirst && isLast;

          customerName =
            appt.customer && appt.customer.name
              ? appt.customer.name
              : "Görüş";
          customerPhone =
            appt.customer && appt.customer.phone ? appt.customer.phone : "";
          startLabel = format(startLocal, "HH:mm");
          endLabel = format(endLocal, "HH:mm");
        }

        return (
          <div key={label} className="time-row">
            <div className="time-label">{label}</div>
            <button
              type="button"
              className={hasAppointment ? "slot has-appointment" : "slot empty-slot"}
              onClick={() => {
                if (hasAppointment) {
                  onAppointmentClick(appt);
                } else {
                  onEmptySlotClick(d);
                }
              }}
            >
            {hasAppointment &&
              (isFirst ? (
                <div
                  className={
                    isSingle
                      ? "appointment-pill appointment-single"
                      : "appointment-pill"
                  }
                >
                  <div className="appointment-name">{customerName}</div>
                  <div className="appointment-meta">
                    {startLabel} – {endLabel}
                  </div>
                  {customerPhone && (
                    <div className="appointment-phone">{customerPhone}</div>
                  )}
                </div>
              ) : (
                // keep the extension block exactly as you have it
                <div
                  className={
                    isLast
                      ? "appointment-extension appointment-extension-last"
                      : "appointment-extension"
                  }
                />
              ))}

            </button>
          </div>
        );
      })}
    </div>
  );
}
