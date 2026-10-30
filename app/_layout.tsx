import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import {
  JetBrainsMono_700Bold,
} from '@expo-google-fonts/jetbrains-mono';
import {
  Orbitron_600SemiBold,
  Orbitron_700Bold,
  useFonts,
} from '@expo-google-fonts/orbitron';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useDailyReset } from '../src/hooks/useDailyReset';
import '../global.css';

export default function RootLayout() {
  useDailyReset();

  const [fontsLoaded] = useFonts({
    Orbitron_700Bold,
    Orbitron_600SemiBold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_700Bold,
    JetBrainsMono_700Bold,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: '#05060E', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#00E5FF" />
      </View>
    );
  }

  return (
  <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#05060E' }}>
    <StatusBar style="light" />
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#05060E' },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="(modals)/stat-allocation"
        options={{
          presentation: 'modal',
          headerShown: false,
          contentStyle: { backgroundColor: '#05060E' },
        }}
      />
      <Stack.Screen
        name="(ceremony)/level-up"
        options={{
          presentation: 'fullScreenModal',
          animation: 'fade',
          headerShown: false,
          contentStyle: { backgroundColor: '#05060E' },
        }}
      />
      <Stack.Screen
        name="skills/[nodeId]"
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
          headerShown: false,
          contentStyle: { backgroundColor: '#05060E' },
        }}
      />
      <Stack.Screen
        name="trials/session"
        options={{
          presentation: 'fullScreenModal',
          animation: 'slide_from_right',
          headerShown: false,
          contentStyle: { backgroundColor: '#05060E' },
        }}
      />
      <Stack.Screen
        name="(ceremony)/arise"
        options={{
          presentation: 'fullScreenModal',
          animation: 'fade',
          headerShown: false,
          contentStyle: { backgroundColor: '#000000' },
        }}
      />
    </Stack>
  </GestureHandlerRootView>
);
}