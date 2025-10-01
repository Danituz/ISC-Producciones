import { startOfWeek, endOfWeek, format, addWeeks } from "date-fns";
import { es } from "date-fns/locale";

export function getWeekRange(d = new Date()) {
  const start = startOfWeek(d, { weekStartsOn: 1 });
  const end = endOfWeek(d, { weekStartsOn: 1 });
  return { start, end };
}

export function formatDate(d: Date, pattern = "EEE d MMM - HH:mm") {
  return format(d, pattern, { locale: es });
}

export function getNextWeek(d = new Date()) {
  return getWeekRange(addWeeks(d, 1));
}
