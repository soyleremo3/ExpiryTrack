// AsyncStorage-backed CRUD for items and settings. Local-only — no backend,
// no account, no SQLite.
import AsyncStorage from '@react-native-async-storage/async-storage';

import { DEFAULT_REMINDER_DAYS } from './constants';
import { cancelAllReminders } from './notifications';
import { clearAllPhotos, deletePhoto } from './photoStorage';
import type { Item, Settings } from '../types';

const ITEMS_KEY = 'expirytrack.items';
const SETTINGS_KEY = 'expirytrack.settings';

export async function getItems(): Promise<Item[]> {
  try {
    const raw = await AsyncStorage.getItem(ITEMS_KEY);
    return raw ? (JSON.parse(raw) as Item[]) : [];
  } catch {
    return [];
  }
}

async function saveItems(items: Item[]): Promise<void> {
  await AsyncStorage.setItem(ITEMS_KEY, JSON.stringify(items));
}

export async function addItem(item: Item): Promise<void> {
  const items = await getItems();
  items.push(item);
  await saveItems(items);
}

export async function updateItem(item: Item): Promise<void> {
  const items = await getItems();
  const index = items.findIndex((existing) => existing.id === item.id);
  if (index === -1) return;
  items[index] = item;
  await saveItems(items);
}

export async function deleteItem(itemId: string): Promise<void> {
  const items = await getItems();
  const target = items.find((item) => item.id === itemId);
  await saveItems(items.filter((item) => item.id !== itemId));
  deletePhoto(target?.photoUri);
}

export async function getSettings(): Promise<Settings> {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    if (raw) return { defaultReminderDays: DEFAULT_REMINDER_DAYS, ...JSON.parse(raw) };
  } catch {
    // fall through to default
  }
  return { defaultReminderDays: DEFAULT_REMINDER_DAYS };
}

export async function updateSettings(settings: Settings): Promise<void> {
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

// Wipes everything the app owns on-device: item records, their scheduled
// reminders, and their app-managed photo files — not just the AsyncStorage
// items key.
export async function clearAll(): Promise<void> {
  await AsyncStorage.removeItem(ITEMS_KEY);
  await cancelAllReminders();
  clearAllPhotos();
}
