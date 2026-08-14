import type { Category, ExpiryStatus } from '../types';

export const DEFAULT_REMINDER_DAYS = 3;

// Fixed local time reminders fire at. Not an exact-alarm guarantee — see
// lib/notifications.ts.
export const REMINDER_HOUR = 9;
export const REMINDER_MINUTE = 0;

export const NOTIFICATION_CHANNEL_ID = 'expiry-reminders';
// Deterministic per-item notification identifier — see types.ts / lib/notifications.ts
// for why Item has no separate stored notificationId field.
export const notificationIdentifierFor = (itemId: string) => `expirytrack:${itemId}`;

export const CATEGORIES: { value: Category; label: string }[] = [
  { value: 'dairy', label: 'Dairy' },
  { value: 'produce', label: 'Produce' },
  { value: 'meat', label: 'Meat' },
  { value: 'pantry', label: 'Pantry' },
  { value: 'frozen', label: 'Frozen' },
  { value: 'other', label: 'Other' },
];

export const STATUS_LABELS: Record<ExpiryStatus, string> = {
  expired: 'Expired',
  today: 'Due today',
  critical: 'Critical',
  soon: 'Soon',
  fresh: 'Fresh',
};

// Raw hex per status, per theme — for native props (icons, badges) that can't
// take a Tailwind class. Kept in sync by hand with the red/amber/green shades
// used in components via NativeWind classes.
export const STATUS_COLORS: Record<'light' | 'dark', Record<ExpiryStatus, string>> = {
  light: {
    expired: '#DC2626', // red-600
    today: '#DC2626',
    critical: '#DC2626',
    soon: '#D97706', // amber-600
    fresh: '#16A34A', // green-600
  },
  dark: {
    expired: '#F87171', // red-400
    today: '#F87171',
    critical: '#F87171',
    soon: '#FBBF24', // amber-400
    fresh: '#4ADE80', // green-400
  },
};
