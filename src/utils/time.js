import { startOfDay, endOfDay, startOfWeek, endOfWeek } from "date-fns";

// Convert a local Date object to a UTC ISO string (standard JS behaviour)
export function toUtcIso(localDate) {
  return localDate.toISOString();
}

// Local AZ day → UTC range for API
export function getUtcRangeForLocalDay(date) {
  const startLocal = startOfDay(date);
  const endLocal = endOfDay(date);
  return {
    from: toUtcIso(startLocal),
    to: toUtcIso(endLocal)
  };
}

// Local AZ week → UTC range for API
export function getUtcRangeForLocalWeek(date) {
  const startLocal = startOfWeek(date, { weekStartsOn: 1 });
  const endLocal = endOfWeek(date, { weekStartsOn: 1 });
  return {
    from: toUtcIso(startLocal),
    to: toUtcIso(endLocal)
  };
}
