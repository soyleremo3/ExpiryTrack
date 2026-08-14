# ExpiryTrack

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Expo SDK](https://img.shields.io/badge/Expo%20SDK-54-000020.svg?logo=expo)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6.svg?logo=typescript&logoColor=white)

Track the expiry date of things you buy — milk, produce, anything with a shelf life — and get reminded before they go bad. Local-only: no account, no backend, no data ever leaves your device.

## Features

- **Add items in seconds** — a name and an expiry date is all that's required; category, quantity/unit, a photo, and a custom reminder are all optional.
- **Color-coded list** — every item shows how many days are left (or how overdue it is) at a glance: green (fresh), yellow (soon), red (critical / due today / expired).
- **Local reminders** — a notification fires a configurable number of days before an item expires. Entirely on-device (no push server, no account required); works offline.
- **Light / Dark / System theme** — follows your OS setting or pick one explicitly.
- **Swipe to delete** — with a confirmation before anything is actually removed.
- **Your data stays yours** — items, photos, and settings all live in on-device storage. Nothing is ever sent anywhere.

## Tech stack

| Layer | Choice |
|---|---|
| Framework | [Expo](https://expo.dev) SDK 54 (React Native 0.81, React 19) |
| Language | TypeScript (`strict`) |
| Navigation | React Navigation v7 (bottom tabs + native stack) |
| Styling | [NativeWind](https://www.nativewind.dev) v4 (Tailwind for React Native) |
| Local storage | `@react-native-async-storage/async-storage` |
| Reminders | `expo-notifications` (local scheduled notifications only) |
| Photos | `expo-image-picker` + `expo-file-system` |
| Gestures | `react-native-gesture-handler` + `react-native-reanimated` |
| Tests | Jest (`jest-expo` preset) |

No state-management library, no `expo-router`, no SQLite, no backend — kept intentionally simple.

## Getting started

**Prerequisites**

- [Node.js](https://nodejs.org) 20+
- The [Expo Go](https://expo.dev/go) app on your phone (iOS or Android) for the fastest way to run this — no native build tooling required

```bash
npm install
npx expo start
```

Scan the QR code Expo prints with the Expo Go app (Android: in-app scanner; iOS: Camera app) to open the project on your phone.

## Project structure

```
App.tsx                  # navigation + theme + notification sync wiring
index.ts                 # entry point (registers the root component)
types.ts                 # Item / Settings / Category types
navigation.ts             # typed React Navigation param lists

lib/
  storage.ts              # AsyncStorage CRUD for items + settings
  notifications.ts        # local scheduled notification logic (permissions, reconcile)
  photoStorage.ts          # copies picked photos into app-managed storage
  format.ts                # pure date/reminder math (unit tested)
  theme.tsx                 # light/dark/system ThemeProvider
  constants.ts               # categories, status colors, defaults

components/                # ItemCard, ExpiryBadge, DatePickerField, …
screens/                   # ItemsListScreen, AddEditItemScreen, SettingsScreen
```

## How reminders work

Every item schedules (at most) one local notification, fired at 09:00 on the day computed from its expiry date minus the reminder window (an item-level override, or the global default from Settings). There is no backend and no push token involved — `expo-notifications` schedules everything directly on your device, so reminders work fully offline.

Notification permission is requested the first time you save an item that needs one (not on first app launch). If you've denied it, Settings shows how to re-enable it from your device's system settings.

## Testing

```bash
npm test
```

Covers the pure date/reminder math in `lib/format.ts` — expiry status boundaries and the "reminder time already passed" edge cases.

## License

[MIT](LICENSE) © Emrullah Söyler
