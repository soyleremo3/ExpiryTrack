// Loading / ErrorNotice — the two states most screens need beyond their own
// content, kept in one place so they stay visually consistent.
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { useThemeColors } from '../lib/theme';

export function Loading() {
  const c = useThemeColors();
  return (
    <View className="flex-1 items-center justify-center bg-background">
      <ActivityIndicator size="large" color={c.accent} />
    </View>
  );
}

export function ErrorNotice({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const c = useThemeColors();
  const box = c.isDark ? 'bg-red-500/10' : 'bg-red-50';
  const text = c.isDark ? 'text-red-300' : 'text-red-700';
  return (
    <View className={`mx-4 mb-2 mt-2 rounded-xl px-4 py-3 ${box}`}>
      <Text className={`text-sm ${text}`}>{message}</Text>
      {onRetry ? (
        <TouchableOpacity className="mt-2" onPress={onRetry} activeOpacity={0.7}>
          <Text className={`text-sm font-semibold ${text}`}>Try again</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}
