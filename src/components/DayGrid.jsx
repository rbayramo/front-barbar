// src/components/DayGrid.jsx
import React, { useContext, useMemo } from "react";
import { format, isSameDay } from "date-fns";
import { AuthContext } from "../context/AuthContext";

const SLOT_MINUTES = 30;

function buildSlots(startMinutes, endMinutes) {
  const slots = [];
  for (let m = startMinutes; m < endMinutes; m += SLOT_MINUTES) {
    const hour = Math.floor(m / 60);
    const minute = m % 60;
    slots.push({ hour, minute });
  }
  return slots;
}

export default function DayGrid({
  date,
  appointments,
  onEmptySlotClick,
  onAppointmentClick
}) {
  const auth = useContext(AuthContext);
  const barber = auth && auth.barber ? auth.barber : null;

  const defaultStart = 8 * 60;
  const defaultEnd = 20 * 60;

  let startMinutes =
    barber && typeof barber.workDayStartMinutes === "number"
      ? barber.workDayStartMinutes
      : defaultStart;
  let endMinutes =
    barber && typeof barber.workDayEndMinutes === "number"
      ? barber.workDayEndMinutes
      : defaultEnd;

  if (endMinutes <= startMinutes) {
    startMinutes = defaultStart;
    endMinutes = defaultEnd;
  }

  const slots = useMemo(
    () => buildSlots(startMinutes, endMinutes),
    [startMinutes, endMinutes]
  );

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
      {slots.map((slot) => {
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
        let servicesLabel = "";

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

          const servicesArray = appt.services || [];
          if (servicesArray.length === 1) {
            servicesLabel = servicesArray[0].name || "";
          } else if (servicesArray.length > 1) {
            const firstName = servicesArray[0].name || "";
            const extraCount = servicesArray.length - 1;
            servicesLabel =
              extraCount > 0
                ? `${firstName} +${extraCount}`
                : firstName;
          }
        }

        return (
          <div key={label} className="time-row">
            <div className="time-label">{label}</div>
            <button
              type="button"
              className={
                hasAppointment ? "slot has-appointment" : "slot empty-slot"
              }
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
                    {servicesLabel && (
                      <div
                        className="appointment-service"
                        style={{ fontSize: 11, opacity: 0.9 }}
                      >
                        {servicesLabel}
                      </div>
                    )}
                    {customerPhone && (
                      <div className="appointment-phone">
                        {customerPhone}
                      </div>
                    )}
                  </div>
                ) : (
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
