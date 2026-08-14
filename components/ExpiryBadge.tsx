import { Text, View } from 'react-native';
import { classifyStatus, daysUntil } from '../lib/format';
import { useStatusColor } from '../lib/theme';

function describeDays(daysLeft: number): string {
  if (daysLeft < 0) return `Expired ${Math.abs(daysLeft)}d ago`;
  if (daysLeft === 0) return 'Due today';
  if (daysLeft === 1) return '1 day left';
  return `${daysLeft} days left`;
}

export function ExpiryBadge({ expiryDate }: { expiryDate: string }) {
  const daysLeft = daysUntil(expiryDate);
  const status = classifyStatus(daysLeft);
  const color = useStatusColor(status);

  return (
    <View className="flex-row items-center">
      <View className="mr-1.5 h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
      <Text className="text-xs font-semibold" style={{ color }}>
        {describeDays(daysLeft)}
      </Text>
    </View>
  );
}
