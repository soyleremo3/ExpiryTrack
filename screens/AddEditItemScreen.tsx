import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';

import { DatePickerField } from '../components/DatePickerField';
import { CategoryChip } from '../components/CategoryChip';
import { CATEGORIES } from '../lib/constants';
import { toDateOnly } from '../lib/format';
import { addItem, getItems, getSettings, updateItem } from '../lib/storage';
import { copyPhoto, deletePhoto } from '../lib/photoStorage';
import { reconcileNotifications, requestPermissionIfNeeded } from '../lib/notifications';
import { useThemeColors } from '../lib/theme';
import type { RootStackParamList } from '../navigation';
import type { Category, Item } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'AddEditItem'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;

function newItemId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export default function AddEditItemScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Props['route']>();
  const c = useThemeColors();
  const itemId = route.params?.itemId;
  const isEditing = Boolean(itemId);

  const [loaded, setLoaded] = useState(!isEditing);
  const [existing, setExisting] = useState<Item | null>(null);
  const [name, setName] = useState('');
  const [expiryDate, setExpiryDate] = useState(() => new Date());
  const [category, setCategory] = useState<Category | undefined>(undefined);
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('');
  const [photoUri, setPhotoUri] = useState<string | undefined>(undefined);
  const [pickedPhotoUri, setPickedPhotoUri] = useState<string | undefined>(undefined);
  const [reminderDays, setReminderDays] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    navigation.setOptions({ title: isEditing ? 'Edit Item' : 'Add Item' });
  }, [navigation, isEditing]);

  useEffect(() => {
    if (!itemId) return;
    getItems().then((items) => {
      const found = items.find((item) => item.id === itemId) ?? null;
      setExisting(found);
      if (found) {
        setName(found.name);
        setExpiryDate(new Date(`${found.expiryDate}T00:00:00`));
        setCategory(found.category);
        setQuantity(found.quantity != null ? String(found.quantity) : '');
        setUnit(found.unit ?? '');
        setPhotoUri(found.photoUri);
        setReminderDays(found.reminderDaysOverride != null ? String(found.reminderDaysOverride) : '');
      }
      setLoaded(true);
    });
  }, [itemId]);

  async function pickPhoto() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Photo access needed', 'Allow photo library access in system settings to attach a photo.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      setPickedPhotoUri(result.assets[0].uri);
      setPhotoUri(result.assets[0].uri);
    }
  }

  function removePhoto() {
    setPickedPhotoUri(undefined);
    setPhotoUri(undefined);
  }

  async function handleSave() {
    const trimmedName = name.trim();
    if (!trimmedName) {
      Alert.alert('Name required', 'Give the item a name before saving.');
      return;
    }

    setSaving(true);
    try {
      const id = existing?.id ?? newItemId();

      let finalPhotoUri = photoUri;
      if (pickedPhotoUri) {
        // A new photo was picked — copy it into app-managed storage and
        // drop the previous app-managed file if this item had one.
        if (existing?.photoUri) deletePhoto(existing.photoUri);
        finalPhotoUri = copyPhoto(pickedPhotoUri, id);
      } else if (existing?.photoUri && !photoUri) {
        // Photo was explicitly removed.
        deletePhoto(existing.photoUri);
        finalPhotoUri = undefined;
      }

      const parsedQuantity = quantity.trim() ? Number(quantity) : undefined;
      const parsedReminderDays = reminderDays.trim() ? Number(reminderDays) : undefined;

      const item: Item = {
        id,
        name: trimmedName,
        expiryDate: toDateOnly(expiryDate),
        category,
        quantity: parsedQuantity != null && !Number.isNaN(parsedQuantity) ? parsedQuantity : undefined,
        unit: unit.trim() || undefined,
        photoUri: finalPhotoUri,
        reminderDaysOverride:
          parsedReminderDays != null && !Number.isNaN(parsedReminderDays) && parsedReminderDays >= 0
            ? parsedReminderDays
            : undefined,
        createdAt: existing?.createdAt ?? new Date().toISOString(),
      };

      if (existing) {
        await updateItem(item);
      } else {
        await addItem(item);
      }

      // First time this app schedules a reminder is the natural moment to
      // lazily ask for notification permission — see lib/notifications.ts.
      await requestPermissionIfNeeded();

      const [allItems, settings] = await Promise.all([getItems(), getSettings()]);
      await reconcileNotifications(allItems, settings);

      navigation.goBack();
    } finally {
      setSaving(false);
    }
  }

  if (!loaded) return null;

  return (
    <ScrollView className="flex-1 bg-background" contentContainerStyle={{ padding: 16 }}>
      <Text className="mb-1 text-sm font-medium text-muted">Name</Text>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="e.g. Milk"
        placeholderTextColor={c.faint}
        className="mb-4 rounded-xl border border-hairline bg-surface px-4 py-3 text-base text-body"
      />

      <View className="mb-4">
        <DatePickerField label="Expiry date" value={expiryDate} onChange={setExpiryDate} />
      </View>

      <Text className="mb-1 text-sm font-medium text-muted">Category (optional)</Text>
      <View className="mb-4 flex-row flex-wrap">
        {CATEGORIES.map((option) => (
          <CategoryChip
            key={option.value}
            label={option.label}
            selected={category === option.value}
            onPress={() => setCategory(category === option.value ? undefined : option.value)}
          />
        ))}
      </View>

      <View className="mb-4 flex-row">
        <View className="mr-2 flex-1">
          <Text className="mb-1 text-sm font-medium text-muted">Quantity (optional)</Text>
          <TextInput
            value={quantity}
            onChangeText={setQuantity}
            placeholder="1"
            placeholderTextColor={c.faint}
            keyboardType="numeric"
            className="rounded-xl border border-hairline bg-surface px-4 py-3 text-base text-body"
          />
        </View>
        <View className="flex-1">
          <Text className="mb-1 text-sm font-medium text-muted">Unit (optional)</Text>
          <TextInput
            value={unit}
            onChangeText={setUnit}
            placeholder="pcs, kg, L…"
            placeholderTextColor={c.faint}
            className="rounded-xl border border-hairline bg-surface px-4 py-3 text-base text-body"
          />
        </View>
      </View>

      <Text className="mb-1 text-sm font-medium text-muted">Photo (optional)</Text>
      <View className="mb-4 flex-row items-center">
        {photoUri ? (
          <Image source={photoUri} contentFit="cover" className="mr-3 h-16 w-16 rounded-xl" />
        ) : null}
        <Pressable
          onPress={pickPhoto}
          className="mr-2 rounded-xl border border-hairline bg-surface px-4 py-2.5"
        >
          <Text className="text-sm font-medium text-body">{photoUri ? 'Change photo' : 'Choose photo'}</Text>
        </Pressable>
        {photoUri ? (
          <Pressable onPress={removePhoto} className="rounded-xl px-3 py-2.5">
            <Text className="text-sm font-medium text-red-600">Remove</Text>
          </Pressable>
        ) : null}
      </View>

      <Text className="mb-1 text-sm font-medium text-muted">Remind me before (optional)</Text>
      <TextInput
        value={reminderDays}
        onChangeText={setReminderDays}
        placeholder="Default (from Settings)"
        placeholderTextColor={c.faint}
        keyboardType="numeric"
        className="mb-6 rounded-xl border border-hairline bg-surface px-4 py-3 text-base text-body"
      />

      <Pressable
        onPress={handleSave}
        disabled={saving}
        className="items-center rounded-xl bg-accent py-3.5"
      >
        <Text className="text-base font-semibold text-white">{saving ? 'Saving…' : 'Save'}</Text>
      </Pressable>
    </ScrollView>
  );
}
