// Pure date math for expiry tracking. Everything here treats dates as local
// calendar days, normalized through Date.UTC as a diffing anchor — so day
// arithmetic can't drift across a DST transition (which shifts wall-clock
// time but never the calendar day itself). None of these functions touch
// AsyncStorage or expo-notifications, which keeps them trivially unit
// testable in isolation.
import type { ExpiryStatus } from '../types';
import { REMINDER_HOUR, REMINDER_MINUTE } from './constants';

const MS_PER_DAY = 86_400_000;

function parseDateOnly(dateOnly: string): { year: number; month: number; day: number } {
  const [year, month, day] = dateOnly.split('-').map(Number);
  return { year, month, day };
}

function dayToUtcMs(year: number, month: number, day: number): number {
  return Date.UTC(year, month - 1, day);
}

// Real local wall-clock moment for a given calendar day at a fixed hour —
// unlike dayToUtcMs, this IS meant to be an actual fireable point in time.
function dateAtLocal(year: number, month: number, day: number, hour: number, minute: number): Date {
  return new Date(year, month - 1, day, hour, minute, 0, 0);
}

export function toDateOnly(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function daysUntil(dateOnly: string, now: Date = new Date()): number {
  const target = parseDateOnly(dateOnly);
  const targetMs = dayToUtcMs(target.year, target.month, target.day);
  const todayMs = dayToUtcMs(now.getFullYear(), now.getMonth() + 1, now.getDate());
  return Math.round((targetMs - todayMs) / MS_PER_DAY);
}

export function classifyStatus(daysLeft: number): ExpiryStatus {
  if (daysLeft < 0) return 'expired';
  if (daysLeft === 0) return 'today';
  if (daysLeft <= 2) return 'critical';
  if (daysLeft <= 7) return 'soon';
  return 'fresh';
}

// expiryDate minus reminderDays, at REMINDER_HOUR:REMINDER_MINUTE local time.
// The subtraction happens on the UTC-anchored calendar day (not a straight ms
// subtraction on a local Date), then the result's y/m/d is read back to build
// the real local wall-clock moment — so it can't land on the wrong side of a
// DST transition.
export function reminderFireDate(dateOnly: string, reminderDays: number): Date {
  const target = parseDateOnly(dateOnly);
  const shiftedMs = dayToUtcMs(target.year, target.month, target.day) - reminderDays * MS_PER_DAY;
  const shifted = new Date(shiftedMs);
  return dateAtLocal(shifted.getUTCFullYear(), shifted.getUTCMonth() + 1, shifted.getUTCDate(), REMINDER_HOUR, REMINDER_MINUTE);
}

// Next valid local reminder moment that is >= now and does not fall after the
// expiry date's calendar day. Returns null when no such moment remains (the
// expiry day's own reminder time has already passed too) — callers fall back
// to the in-app status view only and don't schedule a notification.
export function nextValidReminderFireDate(
  dateOnly: string,
  reminderDays: number,
  now: Date = new Date()
): Date | null {
  const expiry = parseDateOnly(dateOnly);
  const expiryDayMs = dayToUtcMs(expiry.year, expiry.month, expiry.day);

  let candidate = reminderFireDate(dateOnly, reminderDays);

  while (candidate.getTime() < now.getTime()) {
    const candidateDayMs = dayToUtcMs(candidate.getFullYear(), candidate.getMonth() + 1, candidate.getDate());
    if (candidateDayMs >= expiryDayMs) {
      // Already at the expiry day's own reminder time and it's still in the
      // past — nothing left to schedule.
      return null;
    }
    const nextDay = new Date(candidateDayMs + MS_PER_DAY);
    candidate = dateAtLocal(nextDay.getUTCFullYear(), nextDay.getUTCMonth() + 1, nextDay.getUTCDate(), REMINDER_HOUR, REMINDER_MINUTE);
  }

  return candidate;
}
