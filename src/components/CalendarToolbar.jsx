import React from "react";

// Azerbaijani short weekday names, index 0 = Sunday
const AZ_WEEKDAY_SHORT = ["B.", "B.e.", "Ç.a.", "Ç.", "C.a.", "C.", "Ş."];

// Azerbaijani short month names, index 0 = January
const AZ_MONTH_SHORT = [
  "Yan",
  "Fev",
  "Mar",
  "Apr",
  "May",
  "İyn",
  "İyl",
  "Avq",
  "Sen",
  "Okt",
  "Noy",
  "Dek"
];

function formatAzDay(date) {
  const dayName = AZ_WEEKDAY_SHORT[date.getDay()];
  const day = date.getDate();
  const month = AZ_MONTH_SHORT[date.getMonth()];
  return `${dayName}, ${day} ${month}`;
}

function formatAzWeekRange(start, end) {
  const startDay = start.getDate();
  const endDay = end.getDate();
  const startMonth = AZ_MONTH_SHORT[start.getMonth()];
  const endMonth = AZ_MONTH_SHORT[end.getMonth()];
  const startYear = start.getFullYear();
  const endYear = end.getFullYear();

  // If same month and year, still show month on both sides to match your style
  if (startMonth === endMonth && startYear === endYear) {
    return `${startDay} ${startMonth} – ${endDay} ${endMonth}`;
  }

  // Different months or years
  return `${startDay} ${startMonth} – ${endDay} ${endMonth}`;
}

export default function CalendarToolbar({
  view,
  onViewChange,
  date,
  weekRange,
  onPrev,
  onNext,
  onToday
}) {
  const label =
    view === "day"
      ? formatAzDay(date)
      : formatAzWeekRange(weekRange.start, weekRange.end);

  return (
    <div className="calendar-toolbar">
      <div className="view-switch">
        <button
          type="button"
          className={view === "day" ? "segmented active" : "segmented"}
          onClick={() => onViewChange("day")}
        >
          Gün
        </button>
        <button
          type="button"
          className={view === "week" ? "segmented active" : "segmented"}
          onClick={() => onViewChange("week")}
        >
          Həftə
        </button>
      </div>

      <div className="toolbar-buttons">
        <button type="button" className="icon-button" onClick={onPrev}>
          ‹
        </button>
        <button type="button" className="icon-button" onClick={onNext}>
          ›
        </button>
        <button type="button" className="today-pill" onClick={onToday}>
          Bu gün
        </button>
      </div>

      <div className="toolbar-date">{label}</div>
    </div>
  );
}
