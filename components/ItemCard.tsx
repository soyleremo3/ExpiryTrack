import { useRef } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import type { SwipeableMethods } from 'react-native-gesture-handler/lib/typescript/components/ReanimatedSwipeable/ReanimatedSwipeableProps';

import { ExpiryBadge } from './ExpiryBadge';
import { confirmDestructive } from './ConfirmDialog';
import { CATEGORIES } from '../lib/constants';
import type { Item } from '../types';

type Props = {
  item: Item;
  onPress: () => void;
  onDelete: () => void;
};

// Separate component (not an inline callback body) so useAnimatedStyle is
// called from a real component instance — renderRightActions is a render
// prop, not a component, and calling hooks directly inside it would break
// the rules of hooks.
function DeleteAction({ progress, onPress }: { progress: SharedValue<number>; onPress: () => void }) {
  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: (1 - Math.min(progress.value, 1)) * 80 }],
  }));
  return (
    <Animated.View style={style} className="ml-2 justify-center">
      <Pressable
        onPress={onPress}
        className="h-full w-20 items-center justify-center rounded-xl bg-red-600"
      >
        <Text className="text-sm font-semibold text-white">Delete</Text>
      </Pressable>
    </Animated.View>
  );
}

export function ItemCard({ item, onPress, onDelete }: Props) {
  const swipeableRef = useRef<SwipeableMethods>(null);
  const categoryLabel = CATEGORIES.find((c) => c.value === item.category)?.label;

  function handleDeletePress() {
    confirmDestructive({
      title: 'Delete item?',
      message: `"${item.name}" and its reminder will be removed.`,
      onConfirm: () => {
        swipeableRef.current?.close();
        onDelete();
      },
    });
  }

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={(progress) => <DeleteAction progress={progress} onPress={handleDeletePress} />}
    >
      <Pressable
        onPress={onPress}
        className="mb-3 flex-row items-center rounded-xl border border-hairline bg-surface p-3"
      >
        {item.photoUri ? (
          <Image source={item.photoUri} contentFit="cover" className="mr-3 h-12 w-12 rounded-lg" />
        ) : null}
        <View className="flex-1">
          <Text className="text-base font-semibold text-body">{item.name}</Text>
          <View className="mt-1 flex-row items-center">
            {categoryLabel ? <Text className="mr-2 text-xs text-faint">{categoryLabel}</Text> : null}
            {item.quantity ? (
              <Text className="mr-2 text-xs text-faint">
                {item.quantity}
                {item.unit ? ` ${item.unit}` : ''}
              </Text>
            ) : null}
          </View>
        </View>
        <ExpiryBadge expiryDate={item.expiryDate} />
      </Pressable>
    </Swipeable>
  );
}
