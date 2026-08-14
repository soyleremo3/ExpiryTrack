# ExpiryTrack

Full project context (architecture, decisions, session log) lives in [PROJECT.md](PROJECT.md) — read it before making non-trivial changes.

## Hard rules

- Local-only. No backend, no account, no analytics, nothing leaves the device.
- No state-management library — plain hooks plus the one `ThemeProvider` Context.
- No `expo-router` — React Navigation, wired by hand in `App.tsx`.
- Notifications are local-scheduled only — no push token, no FCM/APNs, no backend.
- Never schedule/cancel a notification directly from a screen — always go through `reconcileNotifications()` in `lib/notifications.ts` so scheduling stays idempotent.
- Stay on Expo SDK 54 (see PROJECT.md §1) until Expo Go's physical-device support has clearly moved past it — don't upgrade just because a newer SDK exists.
