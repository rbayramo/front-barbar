// src/components/WeekGrid.jsx
import React, { useContext, useMemo } from "react";
import { addDays, format } from "date-fns";
import { AuthContext } from "../context/AuthContext";

// Azerbaijani short weekday names, index 0 = Sunday
const AZ_WEEKDAY_SHORT = ["B.", "B.e.", "Ç.a.", "Ç.", "C.a.", "C.", "Ş."];

function getAzWeekdayShortName(date) {
  return AZ_WEEKDAY_SHORT[date.getDay()];
}

// startMinutes / endMinutes bərbərin iş saatlarından gəlir
function buildSlots(startMinutes, endMinutes) {
  const SLOT_MINUTES = 30;
  const slots = [];
  for (let m = startMinutes; m < endMinutes; m += SLOT_MINUTES) {
    const hour = Math.floor(m / 60);
    const minute = m % 60;
    slots.push({ hour, minute });
  }
  return slots;
}

const SLOT_MINUTES = 30;

export default function WeekGrid({
  weekStart,
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

  // əgər nəsə səhv dəyərlərdirsə fallback 8–20
  if (endMinutes <= startMinutes) {
    startMinutes = defaultStart;
    endMinutes = defaultEnd;
  }

  const slots = useMemo(
    () => buildSlots(startMinutes, endMinutes),
    [startMinutes, endMinutes]
  );

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

        {slots.map((slot) => {
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
                let servicesLabel = "";

                if (hasAppointment) {
                  const startLocal = new Date(appt.startTime);
                  const endLocal = appt.endTime
                    ? new Date(appt.endTime)
                    : new Date(
                        startLocal.getTime() +
                          SLOT_MINUTES * 60 * 1000
                      );

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
                          {servicesLabel && (
                            <div
                              className="week-appointment-service"
                              style={{
                                fontSize: 11,
                                opacity: 0.9
                              }}
                            >
                              {servicesLabel}
                            </div>
                          )}
                          {customerPhone && (
                            <div className="week-appointment-phone">
                              {customerPhone}
                            </div>
                          )}
                        </div>
                      ) : (
                        // extension blokları eyni saxlayırıq
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
