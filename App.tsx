// App entry point.
//
// Theme: ThemeProvider resolves light/dark/system and hands the active
// palette down as CSS variables via a `vars()` provider (see lib/theme.tsx),
// so semantic NativeWind classes (bg-background, text-body, …) always match
// the current theme.
//
// Notifications: on cold start, reconcileNotifications syncs whatever's
// currently scheduled to match the stored items + settings — covers the case
// where the app was closed while a reminder should have been rescheduled
// (e.g. the system clock changed, or a previous run was killed mid-write).
import './global.css';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
  type Theme,
} from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

import { DARK_VARS, LIGHT_VARS, ThemeProvider, useThemeColors } from './lib/theme';
import { getItems, getSettings } from './lib/storage';
import { reconcileNotifications } from './lib/notifications';
import type { RootStackParamList, TabParamList } from './navigation';

import ItemsListScreen from './screens/ItemsListScreen';
import AddEditItemScreen from './screens/AddEditItemScreen';
import SettingsScreen from './screens/SettingsScreen';

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

const TAB_ICONS: Record<keyof TabParamList, keyof typeof Ionicons.glyphMap> = {
  Items: 'basket',
  Settings: 'settings',
};

function Tabs() {
  const c = useThemeColors();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerStyle: { backgroundColor: c.bg },
        headerTitleStyle: { color: c.body },
        headerShadowVisible: false,
        tabBarActiveTintColor: c.accent,
        tabBarInactiveTintColor: c.faint,
        tabBarStyle: { backgroundColor: c.bg, borderTopColor: c.hairline },
        sceneContainerStyle: { backgroundColor: c.bg },
        tabBarIcon: ({ color, size }) => (
          <Ionicons name={TAB_ICONS[route.name]} size={size} color={color} />
        ),
      })}
    >
      <Tab.Screen name="Items" component={ItemsListScreen} options={{ title: 'My Items' }} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <AppShell />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

function AppShell() {
  const c = useThemeColors();

  useEffect(() => {
    Promise.all([getItems(), getSettings()]).then(([items, settings]) =>
      reconcileNotifications(items, settings)
    );
  }, []);

  const base = c.isDark ? DarkTheme : DefaultTheme;
  const navTheme: Theme = {
    ...base,
    colors: {
      ...base.colors,
      background: c.bg,
      card: c.bg,
      text: c.body,
      border: c.hairline,
      primary: c.accent,
    },
  };

  const themeVars = c.isDark ? DARK_VARS : LIGHT_VARS;

  return (
    <View className="flex-1" style={themeVars}>
      <SafeAreaProvider>
        <StatusBar style={c.isDark ? 'light' : 'dark'} />
        <NavigationContainer theme={navTheme}>
          <Stack.Navigator
            screenOptions={{
              headerStyle: { backgroundColor: c.bg },
              headerTintColor: c.accent,
              headerTitleStyle: { color: c.body },
              headerShadowVisible: false,
              contentStyle: { backgroundColor: c.bg },
            }}
          >
            <Stack.Screen name="Tabs" component={Tabs} options={{ headerShown: false }} />
            <Stack.Screen name="AddEditItem" component={AddEditItemScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </View>
  );
}
