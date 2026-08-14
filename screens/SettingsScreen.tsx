import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useFocusEffect } from '@react-navigation/native';

import { ThemeToggle } from '../components/ThemeToggle';
import { confirmDestructive } from '../components/ConfirmDialog';
import { DEFAULT_REMINDER_DAYS } from '../lib/constants';
import { clearAll, getItems, getSettings, updateSettings } from '../lib/storage';
import { openNotificationSettings, reconcileNotifications, requestPermissionIfNeeded } from '../lib/notifications';
import { useThemeColors } from '../lib/theme';

export default function SettingsScreen() {
  const c = useThemeColors();
  const [defaultReminderDays, setDefaultReminderDays] = useState(String(DEFAULT_REMINDER_DAYS));
  const [permission, setPermission] = useState<{ granted: boolean; canAskAgain: boolean } | null>(null);

  const loadPermission = useCallback(async () => {
    const status = await Notifications.getPermissionsAsync();
    setPermission({ granted: status.granted, canAskAgain: status.canAskAgain });
  }, []);

  useFocusEffect(
    useCallback(() => {
      getSettings().then((settings) => setDefaultReminderDays(String(settings.defaultReminderDays)));
      loadPermission();
    }, [loadPermission])
  );

  async function handleReminderDaysChange(value: string) {
    setDefaultReminderDays(value);
    const parsed = Number(value);
    if (!value.trim() || Number.isNaN(parsed) || parsed < 0) return;

    await updateSettings({ defaultReminderDays: parsed });
    const [items, settings] = await Promise.all([getItems(), getSettings()]);
    await reconcileNotifications(items, settings);
  }

  async function handleEnableNotifications() {
    const outcome = await requestPermissionIfNeeded();
    await loadPermission();
    if (outcome.granted) {
      const [items, settings] = await Promise.all([getItems(), getSettings()]);
      await reconcileNotifications(items, settings);
    }
  }

  function handleClearAll() {
    confirmDestructive({
      title: 'Clear all data?',
      message: 'This removes every tracked item, its photo, and its reminder. This cannot be undone.',
      confirmLabel: 'Clear everything',
      onConfirm: async () => {
        await clearAll();
        await loadPermission();
      },
    });
  }

  return (
    <ScrollView className="flex-1 bg-background" contentContainerStyle={{ padding: 16 }}>
      <Text className="mb-2 text-sm font-medium text-muted">Appearance</Text>
      <View className="mb-6">
        <ThemeToggle />
      </View>

      <Text className="mb-2 text-sm font-medium text-muted">Default reminder (days before expiry)</Text>
      <TextInput
        value={defaultReminderDays}
        onChangeText={handleReminderDaysChange}
        keyboardType="numeric"
        placeholderTextColor={c.faint}
        className="mb-6 rounded-xl border border-hairline bg-surface px-4 py-3 text-base text-body"
      />

      <Text className="mb-2 text-sm font-medium text-muted">Notifications</Text>
      <View className="mb-6 rounded-xl border border-hairline bg-surface p-4">
        <Text className="mb-2 text-sm text-body">
          {permission?.granted ? 'Enabled' : 'Off — reminders will not be sent'}
        </Text>
        {!permission?.granted ? (
          <Pressable
            onPress={permission?.canAskAgain === false ? openNotificationSettings : handleEnableNotifications}
            className="items-center rounded-lg bg-accent px-4 py-2.5"
          >
            <Text className="text-sm font-semibold text-white">
              {permission?.canAskAgain === false ? 'Open system settings' : 'Enable notifications'}
            </Text>
          </Pressable>
        ) : null}
      </View>

      <Pressable
        onPress={handleClearAll}
        className="items-center rounded-xl border border-red-600/40 py-3.5"
      >
        <Text className="text-base font-semibold text-red-600">Clear all data</Text>
      </Pressable>

      <Text className="mt-8 text-center text-xs text-faint">ExpiryTrack v1.0.0 · local-only, no account</Text>
    </ScrollView>
  );
}
