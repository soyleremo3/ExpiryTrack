// Local scheduled notifications only — no backend, no push token, no
// FCM/APNs. Everything here runs entirely on-device via expo-notifications'
// local scheduling APIs.
import * as Notifications from 'expo-notifications';
import { Linking, Platform } from 'react-native';

import { NOTIFICATION_CHANNEL_ID, notificationIdentifierFor } from './constants';
import { nextValidReminderFireDate } from './format';
import type { Item, Settings } from '../types';

// Foreground behavior: if a scheduled reminder fires while the app is open,
// show it as a banner/in the notification list instead of staying silent.
// Sound is off — sade MVP behavior, nothing configurable here yet.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

const IDENTIFIER_PREFIX = 'expirytrack:';

async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNEL_ID, {
    name: 'Expiry reminders',
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

export type PermissionOutcome = { granted: boolean; canAskAgain: boolean };

// Lazy permission request — call this the first time the user actually
// needs a reminder (e.g. saving an item), not on app launch. The Android
// notification channel must exist before the permission prompt for the
// Android 13+ flow to behave correctly, so it's created here first.
export async function requestPermissionIfNeeded(): Promise<PermissionOutcome> {
  await ensureAndroidChannel();

  const current = await Notifications.getPermissionsAsync();
  if (current.granted) {
    return { granted: true, canAskAgain: current.canAskAgain };
  }
  if (!current.canAskAgain) {
    // Previously denied — the OS won't show its own prompt again. Callers
    // should offer a way to open system Settings instead.
    return { granted: false, canAskAgain: false };
  }

  const requested = await Notifications.requestPermissionsAsync();
  return { granted: requested.granted, canAskAgain: requested.canAskAgain };
}

export function openNotificationSettings(): void {
  Linking.openSettings();
}

function reminderBody(item: Item): string {
  return `${item.name} expires on ${item.expiryDate}.`;
}

// Idempotently syncs scheduled local notifications to match `items` +
// `settings`. Each item's notification uses a deterministic identifier
// (`expirytrack:<itemId>`, see lib/constants.ts) — scheduling again with the
// same identifier replaces the previous request for it rather than creating
// a duplicate, so a per-item create/update collapses into a single call.
// Items with no valid future reminder time (see nextValidReminderFireDate)
// or without notification permission simply have their identifier canceled;
// anything scheduled under our prefix that no longer corresponds to a
// current item (deleted items, leftovers from a previous run) is canceled
// too — a true reconcile, not a blind cancel-everything-and-recreate.
export async function reconcileNotifications(items: Item[], settings: Settings): Promise<void> {
  const permission = await Notifications.getPermissionsAsync();
  const canSchedule = permission.granted;
  const now = new Date();
  const desiredIdentifiers = new Set<string>();

  for (const item of items) {
    const identifier = notificationIdentifierFor(item.id);
    const reminderDays = item.reminderDaysOverride ?? settings.defaultReminderDays;
    const fireDate = canSchedule ? nextValidReminderFireDate(item.expiryDate, reminderDays, now) : null;

    if (!fireDate) {
      await Notifications.cancelScheduledNotificationAsync(identifier).catch(() => {});
      continue;
    }

    desiredIdentifiers.add(identifier);
    await Notifications.scheduleNotificationAsync({
      identifier,
      content: {
        title: `${item.name} is expiring soon`,
        body: reminderBody(item),
        data: { itemId: item.id },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: fireDate,
        channelId: NOTIFICATION_CHANNEL_ID,
      },
    });
  }

  const existing = await Notifications.getAllScheduledNotificationsAsync();
  const stale = existing.filter(
    (n) => n.identifier.startsWith(IDENTIFIER_PREFIX) && !desiredIdentifiers.has(n.identifier)
  );
  await Promise.all(
    stale.map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier).catch(() => {}))
  );
}

// Blunt "nuke everything" used only by Settings' clear-all-data action —
// reconcileNotifications is the one used everywhere else.
export async function cancelAllReminders(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
