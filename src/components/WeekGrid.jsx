import React from "react";
import { addDays, format } from "date-fns";

// Azerbaijani short weekday names, index 0 = Sunday
const AZ_WEEKDAY_SHORT = ["B.", "B.e.", "Ç.a.", "Ç.", "C.a.", "C.", "Ş."];

function getAzWeekdayShortName(date) {
  return AZ_WEEKDAY_SHORT[date.getDay()];
}


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

export default function WeekGrid({
  weekStart,
  appointments,
  onEmptySlotClick,
  onAppointmentClick
}) {
  const days = Array.from({ length: 7 }).map((_, idx) =>
    addDays(weekStart, idx)
  );

  function findAppointmentAt(slotDate) {
    return appointments.find((a) => {
      const startLocal = new Date(a.startTime);
      const endLocal = a.endTime
        ? new Date(a.endTime)
        : new Date(startLocal.getTime() + 30 * 60 * 1000);
      return slotDate >= startLocal && slotDate < endLocal;
    });
  }

  return (
    <div className="week-grid-card">
      <div className="week-grid-inner">
        <div className="week-grid-header-row">
          <div className="week-grid-time-header" />
          {days.map((d, idx) => (
            <div key={idx} className="week-grid-day-header">
              <div className="week-day-name">{getAzWeekdayShortName(d)}</div>
              <div className="week-day-date">{format(d, "d")}</div>
            </div>
          ))}

        </div>

        {SLOTS.map((slot) => {
          const timeDate = new Date(weekStart);
          timeDate.setHours(slot.hour, slot.minute, 0, 0);
          const timeLabel = format(timeDate, "HH:mm");

          return (
            <div key={timeLabel} className="week-grid-row">
              <div className="week-time-label">{timeLabel}</div>
              {days.map((day, dayIndex) => {
                const slotDate = new Date(day);
                slotDate.setHours(slot.hour, slot.minute, 0, 0);

                const appt = findAppointmentAt(slotDate);
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

                  const slotStart = slotDate;
                  const slotEnd = new Date(
                    slotStart.getTime() + SLOT_MINUTES * 60 * 1000
                  );

                  isFirst =
                    startLocal.getHours() === slotStart.getHours() &&
                    startLocal.getMinutes() === slotStart.getMinutes();

                  isLast = slotEnd >= endLocal && slotStart < endLocal;
                  isSingle = isFirst && isLast;

                  customerName =
                    appt.customer && appt.customer.name
                      ? appt.customer.name
                      : "Görüş";
                  customerPhone =
                    appt.customer && appt.customer.phone
                      ? appt.customer.phone
                      : "";
                  startLabel = format(startLocal, "HH:mm");
                  endLabel = format(endLocal, "HH:mm");
                }

                return (
                  <button
                    key={dayIndex}
                    type="button"
                    className={
                      hasAppointment
                        ? "week-slot has-appointment"
                        : "week-slot empty-slot"
                    }
                    onClick={() => {
                      if (hasAppointment) {
                        onAppointmentClick(appt);
                      } else {
                        onEmptySlotClick(slotDate);
                      }
                    }}
                  >
                  {hasAppointment &&
                    (isFirst ? (
                      <div
                        className={
                          isSingle
                            ? "week-appointment-pill appointment-single"
                            : "week-appointment-pill"
                        }
                      >
                        <div className="week-appointment-name">
                          {customerName}
                        </div>
                        <div className="week-appointment-meta">
                          {startLabel} – {endLabel}
                        </div>
                        {customerPhone && (
                          <div className="week-appointment-phone">
                            {customerPhone}
                          </div>
                        )}
                      </div>
                    ) : (
                      // keep the extension block exactly as it is
                      <div
                        className={
                          isLast
                            ? "week-appointment-extension appointment-extension-last"
                            : "week-appointment-extension"
                        }
                      />
                    ))}

                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
