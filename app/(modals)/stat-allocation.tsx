import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SystemPanel } from '../../src/components/SystemPanel';
import { useUserStore } from '../../src/store/useUserStore';
import { colors, fonts, radius, spacing } from '../../src/theme/tokens';
import { StatFocus } from '../../src/types/engine';

export default function StatAllocationModal() {
  const router = useRouter();
  const user = useUserStore((state) => state.user);
  const allocateStats = useUserStore((state) => state.allocateStats);

  // Local state for pending distribution
  const [allocated, setAllocated] = useState<{ str: number; vit: number; agi: number }>({
    str: 0,
    vit: 0,
    agi: 0,
  });

  const totalSpent = allocated.str + allocated.vit + allocated.agi;
  const remainingSP = user.statPoints - totalSpent;

  const handleIncrement = (stat: StatFocus) => {
    if (remainingSP <= 0) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Fallback
    }
    setAllocated((prev) => ({
      ...prev,
      [stat]: prev[stat] + 1,
    }));
  };

  const handleDecrement = (stat: StatFocus) => {
    if (allocated[stat] <= 0) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Fallback
    }
    setAllocated((prev) => ({
      ...prev,
      [stat]: prev[stat] - 1,
    }));
  };

  const handleConfirm = () => {
    if (totalSpent === 0) return;

    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // Fallback
    }

    allocateStats(allocated);
    router.back();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Modal Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerSub}>SYSTEM PROTOCOL</Text>
            <Text style={styles.headerTitle}>STAT ALLOCATION</Text>
          </View>
          <Pressable style={styles.closeButton} onPress={() => router.back()}>
            <Ionicons name="close" size={22} color={colors.textMuted} />
          </Pressable>
        </View>

        {/* SP Status Banner */}
        <SystemPanel style={styles.spBanner}>
          <View style={styles.spBannerContent}>
            <View>
              <Text style={styles.spBannerLabel}>AVAILABLE STAT POINTS</Text>
              <Text style={styles.spBannerValue}>{remainingSP} SP</Text>
            </View>
            <View style={styles.spBadge}>
              <Text style={styles.spBadgeText}>TOTAL: {user.statPoints}</Text>
            </View>
          </View>
        </SystemPanel>

        <Text style={styles.sectionNotice}>
          Adjust attributes using unspent stat points. Upgrades are permanent.
        </Text>

        {/* Attribute Allocator Cards */}
        <View style={styles.statList}>
          {/* Strength */}
          <StatRow
            label="STRENGTH (STR)"
            description="Increases muscular power, push/pull resistance, and force output."
            currentVal={user.stats.str}
            allocatedVal={allocated.str}
            canAdd={remainingSP > 0}
            canSub={allocated.str > 0}
            onAdd={() => handleIncrement('str')}
            onSub={() => handleDecrement('str')}
            accentColor={colors.systemCyan}
          />

          {/* Vitality */}
          <StatRow
            label="VITALITY (VIT)"
            description="Amplifies physical endurance, core density, and fatigue resistance."
            currentVal={user.stats.vit}
            allocatedVal={allocated.vit}
            canAdd={remainingSP > 0}
            canSub={allocated.vit > 0}
            onAdd={() => handleIncrement('vit')}
            onSub={() => handleDecrement('vit')}
            accentColor={colors.success}
          />

          {/* Agility */}
          <StatRow
            label="AGILITY (AGI)"
            description="Improves run velocity, stride efficiency, and cardiovascular threshold."
            currentVal={user.stats.agi}
            allocatedVal={allocated.agi}
            canAdd={remainingSP > 0}
            canSub={allocated.agi > 0}
            onAdd={() => handleIncrement('agi')}
            onSub={() => handleDecrement('agi')}
            accentColor={colors.violetCore}
          />
        </View>

        {/* Confirmation Buttons */}
        <View style={styles.actionFooter}>
          <Pressable
            style={({ pressed }) => [
              styles.confirmButton,
              totalSpent === 0 && styles.confirmButtonDisabled,
              pressed && totalSpent > 0 && styles.buttonPressed,
            ]}
            onPress={handleConfirm}
            disabled={totalSpent === 0}
          >
            <Text
              style={[
                styles.confirmButtonText,
                totalSpent === 0 && styles.confirmButtonTextDisabled,
              ]}
            >
              CONFIRM ALLOCATION ({totalSpent} SP)
            </Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.cancelButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={() => router.back()}
          >
            <Text style={styles.cancelButtonText}>CANCEL</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

interface StatRowProps {
  label: string;
  description: string;
  currentVal: number;
  allocatedVal: number;
  canAdd: boolean;
  canSub: boolean;
  onAdd: () => void;
  onSub: () => void;
  accentColor: string;
}

function StatRow({
  label,
  description,
  currentVal,
  allocatedVal,
  canAdd,
  canSub,
  onAdd,
  onSub,
  accentColor,
}: StatRowProps) {
  const newVal = currentVal + allocatedVal;

  return (
    <SystemPanel style={styles.statCard}>
      <View style={styles.statHeaderRow}>
        <Text style={[styles.statTitle, { color: accentColor }]}>{label}</Text>
        <View style={styles.valueRow}>
          <Text style={styles.currentNumber}>{currentVal}</Text>
          {allocatedVal > 0 && (
            <Text style={styles.arrowHighlight}> → {newVal}</Text>
          )}
        </View>
      </View>

      <Text style={styles.statDescription}>{description}</Text>

      <View style={styles.stepperContainer}>
        <Pressable
          style={({ pressed }) => [
            styles.stepButton,
            !canSub && styles.stepButtonDisabled,
            pressed && canSub && styles.buttonPressed,
          ]}
          onPress={onSub}
          disabled={!canSub}
        >
          <Ionicons
            name="remove"
            size={18}
            color={canSub ? colors.systemCyan : colors.textMuted}
          />
        </Pressable>

        <View style={styles.deltaBox}>
          <Text
            style={[
              styles.deltaText,
              allocatedVal > 0 && styles.deltaTextActive,
            ]}
          >
            +{allocatedVal}
          </Text>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.stepButton,
            !canAdd && styles.stepButtonDisabled,
            pressed && canAdd && styles.buttonPressed,
          ]}
          onPress={onAdd}
          disabled={!canAdd}
        >
          <Ionicons
            name="add"
            size={18}
            color={canAdd ? colors.systemCyan : colors.textMuted}
          />
        </Pressable>
      </View>
    </SystemPanel>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bgAbyss,
  },
  container: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  headerSub: {
    fontFamily: fonts.interMedium,
    color: colors.systemCyanDim,
    fontSize: 10,
    letterSpacing: 1.5,
  },
  headerTitle: {
    fontFamily: fonts.orbitronBold,
    color: colors.textPrimary,
    fontSize: 20,
    letterSpacing: 2,
    marginTop: 2,
  },
  closeButton: {
    padding: 8,
    borderRadius: radius.sm,
    backgroundColor: colors.bgPanel,
    borderWidth: 1,
    borderColor: colors.systemCyanDim,
  },
  spBanner: {
    marginBottom: spacing.md,
  },
  spBannerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  spBannerLabel: {
    fontFamily: fonts.orbitronSemiBold,
    color: colors.systemCyanDim,
    fontSize: 10,
    letterSpacing: 1.5,
  },
  spBannerValue: {
    fontFamily: fonts.jetBrainsMonoBold,
    color: colors.systemCyan,
    fontSize: 26,
    marginTop: 2,
  },
  spBadge: {
    backgroundColor: '#002B33',
    borderWidth: 1,
    borderColor: colors.systemCyanDim,
    borderRadius: radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  spBadgeText: {
    fontFamily: fonts.jetBrainsMonoBold,
    color: colors.textPrimary,
    fontSize: 11,
  },
  sectionNotice: {
    fontFamily: fonts.interRegular,
    color: colors.textMuted,
    fontSize: 12,
    marginBottom: spacing.lg,
  },
  statList: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  statCard: {
    padding: spacing.md,
  },
  statHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  statTitle: {
    fontFamily: fonts.orbitronBold,
    fontSize: 13,
    letterSpacing: 1,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currentNumber: {
    fontFamily: fonts.jetBrainsMonoBold,
    color: colors.textPrimary,
    fontSize: 16,
  },
  arrowHighlight: {
    fontFamily: fonts.jetBrainsMonoBold,
    color: colors.systemCyan,
    fontSize: 16,
  },
  statDescription: {
    fontFamily: fonts.interRegular,
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 16,
    marginBottom: spacing.md,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
  stepButton: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.systemCyanDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepButtonDisabled: {
    opacity: 0.35,
    borderColor: '#1A2138',
  },
  deltaBox: {
    minWidth: 44,
    alignItems: 'center',
  },
  deltaText: {
    fontFamily: fonts.jetBrainsMonoBold,
    color: colors.textMuted,
    fontSize: 16,
  },
  deltaTextActive: {
    color: colors.systemCyan,
  },
  actionFooter: {
    gap: spacing.sm,
  },
  confirmButton: {
    backgroundColor: colors.systemCyan,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: '#0D2730',
    opacity: 0.6,
  },
  confirmButtonText: {
    fontFamily: fonts.orbitronBold,
    color: colors.bgAbyss,
    fontSize: 13,
    letterSpacing: 1.5,
  },
  confirmButtonTextDisabled: {
    color: colors.textMuted,
  },
  cancelButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontFamily: fonts.orbitronSemiBold,
    color: colors.textMuted,
    fontSize: 12,
    letterSpacing: 1,
  },
  buttonPressed: {
    transform: [{ scale: 0.98 }],
  },
});
