import { Pressable, Text } from 'react-native';

type Props = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
};

export function CategoryChip({ label, selected, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      className={`mb-2 mr-2 rounded-full border px-3 py-1.5 ${
        selected ? 'border-accent bg-accent' : 'border-hairline bg-surface'
      }`}
    >
      <Text className={`text-sm font-medium ${selected ? 'text-white' : 'text-body'}`}>{label}</Text>
    </Pressable>
  );
}
