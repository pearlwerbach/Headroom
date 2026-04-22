import { clsx, type ClassValue } from "clsx";
import { format, formatDistanceToNowStrict } from "date-fns";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatHours(value: number) {
  return `${Number(value.toFixed(1))}h`;
}

export function formatDateTime(date: Date) {
  return format(date, "EEE, MMM d 'at' h:mm a");
}

export function formatDate(date: Date) {
  return format(date, "EEE, MMM d");
}

export function formatRelativeDue(date: Date) {
  return formatDistanceToNowStrict(date, { addSuffix: true });
}

export function startOfLocalDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function endOfLocalDay(date: Date) {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
}

export function minutesBetween(start: Date, end: Date) {
  return Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000));
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
