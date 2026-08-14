import { useCallback, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { ItemCard } from '../components/ItemCard';
import { EmptyState } from '../components/EmptyState';
import { Loading } from '../components/Feedback';
import { deleteItem, getItems, getSettings } from '../lib/storage';
import { reconcileNotifications } from '../lib/notifications';
import { daysUntil } from '../lib/format';
import type { RootStackParamList } from '../navigation';
import type { Item } from '../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function ItemsListScreen() {
  const navigation = useNavigation<Nav>();
  const [items, setItems] = useState<Item[] | null>(null);

  const load = useCallback(async () => {
    const loaded = await getItems();
    loaded.sort((a, b) => daysUntil(a.expiryDate) - daysUntil(b.expiryDate));
    setItems(loaded);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function handleDelete(id: string) {
    await deleteItem(id);
    const [remaining, settings] = await Promise.all([getItems(), getSettings()]);
    remaining.sort((a, b) => daysUntil(a.expiryDate) - daysUntil(b.expiryDate));
    setItems(remaining);
    reconcileNotifications(remaining, settings);
  }

  return (
    <View className="flex-1 bg-background">
      {items === null ? (
        <Loading />
      ) : items.length === 0 ? (
        <EmptyState
          title="Nothing tracked yet"
          message="Add a product and its expiry date to get reminders before it goes bad."
        />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <ItemCard
              item={item}
              onPress={() => navigation.navigate('AddEditItem', { itemId: item.id })}
              onDelete={() => handleDelete(item.id)}
            />
          )}
        />
      )}
      <Pressable
        onPress={() => navigation.navigate('AddEditItem', undefined)}
        className="absolute bottom-6 right-6 h-14 w-14 items-center justify-center rounded-full bg-accent shadow-lg"
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </Pressable>
    </View>
  );
}
