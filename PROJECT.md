# ExpiryTrack — project memory

Local-only Expo/React Native/TypeScript app for tracking product expiry dates and getting reminded before they expire. See [README.md](README.md) for the user-facing overview.

## 1. SDK version decision

Built on **Expo SDK 54**, deliberately not the latest (SDK 57 as of this writing). The npm registry's `latest` dist-tag for `expo` and the default `create-expo-app` template had already moved to SDK 57 by the time this project was scaffolded — but the project's actual physical-device testing constraint (Expo Go, no Apple Developer account / no dev client) meant the only thing that mattered was **what the installed Expo Go app on the phone actually supports right now**, not what npm considers "latest".

Expo Go's own policy (confirmed via docs.expo.dev): the App Store build of Expo Go supports **exactly one SDK version at a time** — whichever was most recently approved. There's no guaranteed overlap window. So "latest on npm" and "what Expo Go can open" can diverge, and did here: at scaffold time, the phone used for testing this project still opened SDK 54 projects fine in Expo Go (verified live, not from a stale doc), so SDK 54 was chosen over SDK 57.

**Consequence:** all native dependencies were installed via `npx expo install <pkg>` so their versions stay compatible with SDK 54 specifically (`expo install` resolves against the *installed* `expo` version, not "latest"). A couple of packages needed manual version pinning because their own `latest` npm dist-tag had already moved to SDK 57:
- `babel-preset-expo` → pinned to `54.0.12` (installing "latest" pulled a `57.x` build incompatible with this project's Metro/babel setup)
- `jest-expo` → pinned to `54.0.17` (same reason — `latest` requires React `^19.2.3`, this project is on React `19.1.0`)

**When to revisit:** once Expo Go on the App/Play Store has clearly moved to SDK 56/57+ (check by opening any SDK 54 project in the current Expo Go build), upgrading is a deliberate, separate task — not something to do reflexively because a newer SDK exists.

## 2. Architecture

- **Navigation:** React Navigation v7 (bottom tabs + native stack), wired by hand in `App.tsx`. No `expo-router` — kept out on purpose.
- **State:** no state-management library. Plain `useState`/`useEffect`/`useCallback` per screen, plus one Context (`ThemeProvider`, `lib/theme.tsx`) for the light/dark/system preference.
- **Storage:** `@react-native-async-storage/async-storage`, two JSON keys (`expirytrack.items`, `expirytrack.settings`) via `lib/storage.ts`. No SQLite, no backend, no account.
- **Styling:** NativeWind v4. Theme is driven by our own `ThemeProvider` state through a `vars()` CSS-variable provider at the root — not NativeWind's own `colorScheme`/`.dark` class API (same reasoning as prior Exposure-* projects this one borrowed its coding style from: that API is deprecated upstream and its Expo Go reliability wasn't worth depending on).
- **Photos:** `expo-file-system`'s new synchronous `File`/`Directory`/`Paths` API (the default export as of `expo-file-system` v19, not the older `documentDirectory`/`copyAsync` Promise-based API). Picked photos are copied into an app-managed `photos/` directory under `Paths.document` (`lib/photoStorage.ts`) so they survive independently of whatever cache path the picker returned.
- **Notifications:** `expo-notifications`, **local scheduled only** — no push token, no FCM/APNs, no backend involved anywhere. See §3.

## 3. Notification design

Every item gets a deterministic notification identifier: `expirytrack:<itemId>` (see `lib/constants.ts`). This is the *only* identity system — `Item` has no separate stored `notificationId` field, because scheduling with an identifier that's already in use **replaces** the previous request for it rather than creating a duplicate (confirmed against the installed `expo-notifications` source: `scheduleNotificationAsync` passes `request.identifier ?? uuid.v4()` straight through to the native scheduler, and both platforms treat a repeated identifier as an update).

`reconcileNotifications(items, settings)` (`lib/notifications.ts`) is the single place that ever touches scheduling:
1. For each item, compute the next valid fire time via `nextValidReminderFireDate` (pure function, `lib/format.ts`) — the reminder date/time minus the days override (or the global default), advanced day-by-day past "already passed" moments but never past the expiry day itself. Returns `null` if even the expiry day's own reminder time has passed.
2. `null` or no notification permission → cancel that item's identifier (no-op if nothing was scheduled).
3. Otherwise → (re)schedule under the same identifier — idempotent by construction, not by diffing against the previously-scheduled time.
4. Anything scheduled under our `expirytrack:` prefix that no longer matches a current item's identifier gets canceled — handles deletions and any drift from a previous run.

This is called after every item add/edit/delete, after the default reminder days setting changes, and once on cold start — never a blind "cancel everything and recreate," and never scattered `scheduleNotificationAsync`/`cancelScheduledNotificationAsync` calls from screens.

**Permission timing:** not requested on app launch. `requestPermissionIfNeeded()` is called the first time a screen actually needs a reminder (saving an item in `AddEditItemScreen`), and creates the Android notification channel *before* requesting permission (required for the Android 13+ flow to behave correctly). If permission was already permanently denied (`canAskAgain === false`), the OS won't show its own prompt again — Settings surfaces this and offers `Linking.openSettings()` instead of re-prompting.

**No exact-alarm permission.** Reminders fire at a fixed local 09:00, computed as a plain calendar-day target — not an exact-to-the-minute guarantee. Deliberately did not add `SCHEDULE_EXACT_ALARM`/exact-alarm permissions to keep this running cleanly in Expo Go without extra native config.

## 4. Date handling

`expiryDate` is always stored as a plain `YYYY-MM-DD` string — no time, no timezone. All day-math in `lib/format.ts` (`daysUntil`, `reminderFireDate`, `nextValidReminderFireDate`) normalizes both sides of any comparison through `Date.UTC(y, m-1, d)` as a diffing anchor before subtracting, specifically so DST transitions (which shift wall-clock time but never the calendar day) can't shift a result by a day. Real fireable moments (the actual `Date` handed to `expo-notifications`) are still built via the local `Date` constructor — the UTC anchor is only ever used for the day-counting arithmetic, never as an actual point in time.

Status thresholds (`classifyStatus`, `lib/format.ts`):

| Days left | Status | Color |
|---|---|---|
| `< 0` | `expired` | red |
| `0` | `today` | red |
| `1–2` | `critical` | red |
| `3–7` | `soon` | yellow |
| `> 7` | `fresh` | green |

All boundaries (including the `nextValidReminderFireDate` "already past, still recoverable" vs. "genuinely out of time" edge cases) are covered by `lib/format.test.ts`.

## 5. Screens

| Screen | Status |
|---|---|
| `ItemsListScreen` | Done — sorted list, swipe-to-delete with confirmation, FAB to add |
| `AddEditItemScreen` | Done — name/date required, category/quantity/unit/photo/reminder-override optional |
| `SettingsScreen` | Done — theme, default reminder days, notification permission status, clear-all-data |

## 6. Open items / not built

- No barcode scanning, no cloud sync, no accounts — out of scope by design, not deferred work.
- No push notifications of any kind — local-only is a deliberate constraint, not a placeholder for a future backend.
