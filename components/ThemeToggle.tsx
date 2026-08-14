import { Pressable, Text, View } from 'react-native';
import { useTheme } from '../lib/theme';
import type { ThemePref } from '../lib/theme';

const OPTIONS: { value: ThemePref; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
];

export function ThemeToggle() {
  const { pref, setPref } = useTheme();
  return (
    <View className="flex-row rounded-xl border border-hairline bg-surface p-1">
      {OPTIONS.map((option) => {
        const active = pref === option.value;
        return (
          <Pressable
            key={option.value}
            onPress={() => setPref(option.value)}
            className={`flex-1 items-center rounded-lg py-2 ${active ? 'bg-accent' : ''}`}
          >
            <Text className={`text-sm font-medium ${active ? 'text-white' : 'text-muted'}`}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
