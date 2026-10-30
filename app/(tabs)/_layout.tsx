import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useUserStore } from '../../src/store/useUserStore';
import { colors, fonts } from '../../src/theme/tokens';

export default function TabLayout() {
  const user = useUserStore((state) => state.user);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.systemCyan,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'DAILY QUEST',
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="flash-outline"
              size={size}
              color={typeof color === 'string' ? color : colors.systemCyan}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="skills"
        options={{
          title: 'SKILLS',
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="git-branch-outline"
              size={size}
              color={typeof color === 'string' ? color : colors.systemCyan}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="trials"
        options={{
          title: 'TRIALS',
          tabBarBadge: user.pendingTrialUnlocked ? '!' : undefined,
          tabBarBadgeStyle: styles.alertBadge,
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="shield-outline"
              size={size}
              color={typeof color === 'string' ? color : colors.systemCyan}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'PROFILE',
          tabBarBadge: user.statPoints > 0 ? user.statPoints : undefined,
          tabBarBadgeStyle: styles.spBadge,
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="person-outline"
              size={size}
              color={typeof color === 'string' ? color : colors.systemCyan}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.bgPanel,
    borderTopWidth: 1,
    borderTopColor: colors.systemCyanDim,
    height: 65,
    paddingBottom: 10,
    paddingTop: 8,
  },
  tabLabel: {
    fontFamily: fonts.orbitronSemiBold,
    fontSize: 10,
    letterSpacing: 1,
  },
  spBadge: {
    backgroundColor: colors.systemCyan,
    color: colors.bgAbyss,
    fontFamily: fonts.jetBrainsMonoBold,
    fontSize: 10,
  },
  alertBadge: {
    backgroundColor: colors.danger,
    color: '#FFFFFF',
    fontFamily: fonts.orbitronBold,
    fontSize: 11,
  },
});
