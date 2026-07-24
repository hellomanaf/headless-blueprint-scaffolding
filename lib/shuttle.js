const WEEKDAY_ALIASES = {
  0: ["0", "sun", "sunday"],
  1: ["1", "mon", "monday"],
  2: ["2", "tue", "tues", "tuesday"],
  3: ["3", "wed", "wednesday"],
  4: ["4", "thu", "thur", "thurs", "thursday"],
  5: ["5", "fri", "friday"],
  6: ["6", "sat", "saturday"],
};

/**
 * Normalize a calendar date string (YYYY-MM-DD) to local Date at noon.
 */
export function parseDateOnly(value) {
  if (!value) return null;
  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const date = new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
    12,
    0,
    0,
  );
  return Number.isNaN(date.getTime()) ? null : date;
}

export function todayDateString() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function addMonthsDateString(dateStr, months) {
  const date = parseDateOnly(dateStr) || new Date();
  date.setMonth(date.getMonth() + months);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function normalizeDayToken(value) {
  return String(value).trim().toLowerCase();
}

function tripRunsOnWeekday(tripDays, date) {
  if (!Array.isArray(tripDays) || tripDays.length === 0) return true;
  const weekday = date.getDay();
  const aliases = WEEKDAY_ALIASES[weekday] || [];
  const normalized = tripDays.map(normalizeDayToken);
  return normalized.some(
    (day) => aliases.includes(day) || day === String(weekday),
  );
}

function isWithinWindow(dateStr, validFrom, validUntil) {
  if (validFrom && dateStr < validFrom) return false;
  if (validUntil && dateStr > validUntil) return false;
  return true;
}

function isBlackedOut(dateStr, lists = []) {
  return lists.some(
    (list) => Array.isArray(list) && list.includes(dateStr),
  );
}

/**
 * Filter product trips that can depart on a given YYYY-MM-DD date.
 */
export function tripsForDate(trips, dateStr, holidays = []) {
  const date = parseDateOnly(dateStr);
  if (!date || !Array.isArray(trips)) return [];

  return trips.filter((trip) => {
    if (!trip || trip.active === false) return false;
    if (!tripRunsOnWeekday(trip.days, date)) return false;
    if (!isWithinWindow(dateStr, trip.validFrom, trip.validUntil)) return false;
    if (isBlackedOut(dateStr, [trip.blackoutDates, holidays])) return false;
    return true;
  });
}

export function formatMoney(amount, currency = "AED") {
  if (amount == null || amount === "") return null;
  const num = Number(amount);
  if (Number.isNaN(num)) return String(amount);

  try {
    return new Intl.NumberFormat("en-AE", {
      style: "currency",
      currency: currency || "AED",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  } catch {
    return `${num.toFixed(2)} ${currency || ""}`.trim();
  }
}

export function formatPriceEach(amount, currency = "AED") {
  const formatted = formatMoney(amount, currency);
  return formatted ? `${formatted} each` : null;
}

export function routeLabel(product) {
  if (product?.routeName) return product.routeName;
  const origin = product?.origin?.name;
  const destination = product?.destination?.name;
  if (origin && destination) return `${origin} to ${destination}`;
  return product?.name || "Shuttle";
}

function formatTripTime(value) {
  if (!value) return "";
  const raw = String(value).trim();
  // Already a clock time like 08:00 or 8:00 AM
  if (/^\d{1,2}:\d{2}/.test(raw)) return raw;
  return raw;
}

export function tripOptionLabel(trip) {
  if (!trip) return "";

  const label = trip.label ? String(trip.label).trim() : "";
  const departure = formatTripTime(trip.departureTime);
  const arrival = formatTripTime(trip.arrivalTime);

  let timePart = "";
  if (departure && arrival) {
    timePart = `${departure}–${arrival}`;
  } else if (departure) {
    timePart = departure;
  }

  if (label && timePart) return `${label} · ${timePart}`;
  if (label) return label;
  if (timePart) return timePart;

  const dest = trip.destination?.name || trip.origin?.name || "";
  return dest || trip.id || "Departure";
}
