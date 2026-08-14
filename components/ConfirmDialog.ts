// Thin wrapper around the native Alert so every destructive action (swipe
// delete, clear-all-data) confirms the same way instead of each call site
// hand-rolling its own button labels/styles.
import { Alert } from 'react-native';

type ConfirmOptions = {
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
};

export function confirmDestructive({ title, message, confirmLabel = 'Delete', onConfirm }: ConfirmOptions) {
  Alert.alert(title, message, [
    { text: 'Cancel', style: 'cancel' },
    { text: confirmLabel, style: 'destructive', onPress: onConfirm },
  ]);
}
