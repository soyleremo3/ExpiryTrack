import { Text, View } from 'react-native';

export function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <View className="flex-1 items-center justify-center px-8">
      <Text className="mb-2 text-lg font-semibold text-body">{title}</Text>
      <Text className="text-center text-sm text-faint">{message}</Text>
    </View>
  );
}
