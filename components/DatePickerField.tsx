// Cross-platform date field. Android's native picker is a modal dialog
// opened imperatively (DateTimePickerAndroid.open); iOS renders an inline
// picker underneath the field when tapped. Both share the same `onChange`
// callback shape from @react-native-community/datetimepicker.
import { useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';

import { useThemeColors } from '../lib/theme';

type Props = {
  label: string;
  value: Date;
  onChange: (date: Date) => void;
  minimumDate?: Date;
};

export function DatePickerField({ label, value, onChange, minimumDate }: Props) {
  const c = useThemeColors();
  const [showIOSPicker, setShowIOSPicker] = useState(false);

  function openPicker() {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value,
        mode: 'date',
        minimumDate,
        onChange: (event, selectedDate) => {
          if (event.type === 'set' && selectedDate) onChange(selectedDate);
        },
      });
    } else {
      setShowIOSPicker((prev) => !prev);
    }
  }

  return (
    <View>
      <Text className="mb-1 text-sm font-medium text-muted">{label}</Text>
      <Pressable
        onPress={openPicker}
        className="rounded-xl border border-hairline bg-surface px-4 py-3"
      >
        <Text className="text-base text-body">{formatDisplay(value)}</Text>
      </Pressable>
      {Platform.OS === 'ios' && showIOSPicker ? (
        <DateTimePicker
          value={value}
          mode="date"
          display="inline"
          minimumDate={minimumDate}
          accentColor={c.accent}
          onChange={(event, selectedDate) => {
            if (selectedDate) onChange(selectedDate);
          }}
        />
      ) : null}
    </View>
  );
}

function formatDisplay(date: Date): string {
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
}
