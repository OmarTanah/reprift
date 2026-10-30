/**
 * S-09 Skill Trees Screen
 *
 * Four tabs: Push / Pull / Core / Legs
 * Each tab renders a vertical node graph using react-native-svg for connecting lines.
 *
 * Node states (visual):
 *   LOCKED      — dim grey circle, padlock icon
 *   UNLOCKABLE  — cyan pulsing ring, star icon (user has enough SP + prereq met)
 *   UNLOCKED    — bright cyan filled circle
 *   VERIFIED    — gold filled circle (feat demonstrated)
 */

import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Line } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { canUnlockNode } from '../../src/engine/skills';
import { ALL_SKILL_TREES, getNodeById } from '../../src/data/skillTrees';
import { useSkillStore } from '../../src/store/useSkillStore';
import { useUserStore } from '../../src/store/useUserStore';
import { colors, fonts, radius, spacing } from '../../src/theme/tokens';
import { SkillNode, SkillTreeType } from '../../src/types/engine';

// ─── Types ───────────────────────────────────────────────────────────────────

type NodeState = 'locked' | 'unlockable' | 'unlocked' | 'verified';

// ─── Tab Config ───────────────────────────────────────────────────────────────

const TREE_TABS: { key: SkillTreeType; label: string }[] = [
  { key: 'push', label: 'PUSH' },
  { key: 'pull', label: 'PULL' },
  { key: 'core', label: 'CORE' },
  { key: 'legs', label: 'LEGS' },
];

// ─── Node geometry ────────────────────────────────────────────────────────────

const NODE_RADIUS = 28;
const NODE_DIAMETER = NODE_RADIUS * 2;
const TIER_HEIGHT = 110; // vertical spacing between tiers
const COLUMN_WIDTH = 90; // horizontal spacing for branching

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getNodeState(
  node: SkillNode,
  progress: Record<string, import('../../src/types/engine').SkillProgress>,
  availableSP: number
): NodeState {
  const p = progress[node.id];

  if (p?.verified) return 'verified';
  if (p?.unlocked) return 'unlocked';

  const canUnlock = canUnlockNode(node, progress, availableSP);
  if (canUnlock) return 'unlockable';

  return 'locked';
}

function getStateColors(state: NodeState): {
  fill: string;
  border: string;
  icon: string;
  labelColor: string;
} {
  switch (state) {
    case 'verified':
      return {
        fill: '#1A1200',
        border: colors.gold,
        icon: colors.gold,
        labelColor: colors.gold,
      };
    case 'unlocked':
      return {
        fill: '#001A20',
        border: colors.systemCyan,
        icon: colors.systemCyan,
        labelColor: colors.systemCyan,
      };
    case 'unlockable':
      return {
        fill: '#00090D',
        border: colors.systemCyan,
        icon: colors.systemCyan,
        labelColor: colors.textPrimary,
      };
    case 'locked':
    default:
      return {
        fill: '#0A0C1A',
        border: '#1A2138',
        icon: colors.textMuted,
        labelColor: colors.textMuted,
      };
  }
}

function getNodeIcon(state: NodeState): keyof typeof import('@expo/vector-icons/build/Icons').Ionicons.glyphMap {
  switch (state) {
    case 'verified': return 'star';
    case 'unlocked': return 'checkmark-circle';
    case 'unlockable': return 'add-circle-outline';
    case 'locked': return 'lock-closed';
  }
}

// ─── Layout computation ───────────────────────────────────────────────────────

interface PositionedNode {
  node: SkillNode;
  x: number;
  y: number;
  col: number; // column index (for branch layout)
}

/**
 * Assigns (x, y) positions to nodes based on tier and branching.
 * Nodes sharing the same prerequisite get placed in adjacent columns.
 */
function computeLayout(nodes: SkillNode[], containerWidth: number): PositionedNode[] {
  // Group by tier
  const byTier: Record<number, SkillNode[]> = {};
  for (const node of nodes) {
    if (!byTier[node.tier]) byTier[node.tier] = [];
    byTier[node.tier].push(node);
  }

  const positioned: PositionedNode[] = [];

  for (const tierStr of Object.keys(byTier).sort((a, b) => Number(a) - Number(b))) {
    const tier = Number(tierStr);
    const tierNodes = byTier[tier];
    const count = tierNodes.length;

    tierNodes.forEach((node, idx) => {
      // Horizontally centre single nodes; spread multiple
      const totalWidth = (count - 1) * COLUMN_WIDTH;
      const startX = containerWidth / 2 - totalWidth / 2;
      const x = startX + idx * COLUMN_WIDTH;
      const y = (tier - 1) * TIER_HEIGHT + NODE_RADIUS;
      positioned.push({ node, x, y, col: idx });
    });
  }

  return positioned;
}

// ─── SkillGraph Component ─────────────────────────────────────────────────────

interface SkillGraphProps {
  tree: SkillTreeType;
  progress: Record<string, import('../../src/types/engine').SkillProgress>;
  availableSP: number;
  onNodePress: (node: SkillNode, state: NodeState) => void;
}

const GRAPH_WIDTH = 320;

function SkillGraph({ tree, progress, availableSP, onNodePress }: SkillGraphProps) {
  const nodes = ALL_SKILL_TREES[tree];
  const positioned = computeLayout(nodes, GRAPH_WIDTH);

  // Build a position lookup
  const posMap = new Map<string, { x: number; y: number }>();
  for (const p of positioned) {
    posMap.set(p.node.id, { x: p.x, y: p.y });
  }

  const maxTier = Math.max(...nodes.map((n) => n.tier));
  const svgHeight = maxTier * TIER_HEIGHT + NODE_DIAMETER;

  return (
    <View style={{ width: GRAPH_WIDTH, alignSelf: 'center' }}>
      {/* SVG Connector Lines */}
      <Svg
        width={GRAPH_WIDTH}
        height={svgHeight}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      >
        {positioned.map(({ node }) => {
          if (!node.prerequisite) return null;
          const from = posMap.get(node.prerequisite);
          const to = posMap.get(node.id);
          if (!from || !to) return null;

          const prereqState = getNodeState(
            nodes.find((n) => n.id === node.prerequisite)!,
            progress,
            availableSP
          );
          const lineColor =
            prereqState === 'verified'
              ? colors.gold
              : prereqState === 'unlocked'
              ? colors.systemCyanDim
              : '#1A2138';

          return (
            <Line
              key={`line_${node.id}`}
              x1={from.x}
              y1={from.y + NODE_RADIUS}
              x2={to.x}
              y2={to.y - NODE_RADIUS}
              stroke={lineColor}
              strokeWidth={2}
              strokeDasharray={prereqState === 'locked' ? '4 4' : undefined}
            />
          );
        })}
      </Svg>

      {/* Node circles */}
      <View style={{ height: svgHeight, width: GRAPH_WIDTH }}>
        {positioned.map(({ node, x, y }) => {
          const state = getNodeState(node, progress, availableSP);
          const stateColors = getStateColors(state);

          return (
            <Pressable
              key={node.id}
              onPress={() => onNodePress(node, state)}
              style={[
                styles.nodeButton,
                {
                  left: x - NODE_RADIUS,
                  top: y - NODE_RADIUS,
                  width: NODE_DIAMETER,
                  height: NODE_DIAMETER,
                  borderRadius: NODE_RADIUS,
                  backgroundColor: stateColors.fill,
                  borderColor: stateColors.border,
                },
              ]}
            >
              <Ionicons
                name={getNodeIcon(state) as any}
                size={16}
                color={stateColors.icon}
              />
            </Pressable>
          );
        })}

        {/* Node labels below circles */}
        {positioned.map(({ node, x, y }) => {
          const state = getNodeState(node, progress, availableSP);
          const stateColors = getStateColors(state);

          return (
            <View
              key={`label_${node.id}`}
              style={[
                styles.nodeLabel,
                {
                  left: x - 40,
                  top: y + NODE_RADIUS + 4,
                  width: 80,
                },
              ]}
              pointerEvents="none"
            >
              <Text
                style={[styles.nodeLabelText, { color: stateColors.labelColor }]}
                numberOfLines={2}
              >
                {node.name}
              </Text>
              <Text style={styles.nodeCostText}>
                {state === 'verified'
                  ? '✓ VERIFIED'
                  : state === 'unlocked'
                  ? '✓ UNLOCKED'
                  : state === 'unlockable'
                  ? `${node.spCost} SP`
                  : 'LOCKED'}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function SkillsScreen() {
  const router = useRouter();
  const user = useUserStore((s) => s.user);
  const skillProgress = useSkillStore((s) => s.progress);
  const unlockSkillNode = useSkillStore((s) => s.unlockNode);

  // Deduct from user's statPoints on unlock
  const setUser = useUserStore((s) => s.setUser);
  const currentUser = useUserStore((s) => s.user);

  const [activeTree, setActiveTree] = useState<SkillTreeType>('push');

  const handleNodePress = (node: SkillNode, state: NodeState) => {
    if (state === 'locked') {
      Alert.alert(
        '[ SYSTEM: NODE LOCKED ]',
        node.prerequisite
          ? `Prerequisite required: unlock and verify "${getNodeById(node.prerequisite)?.name ?? node.prerequisite}" first.`
          : `You need ${node.spCost} Stat Points to unlock this node.`,
        [{ text: 'OK', style: 'default' }]
      );
      return;
    }

    // Navigate to detail screen for all other states
    router.push(`/skills/${node.id}`);
  };

  const handleUnlockFromDetail = (nodeId: string) => {
    const node = getNodeById(nodeId);
    if (!node) return;

    const success = unlockSkillNode(nodeId, user.statPoints, () => {
      // Deduct SP from user store
      setUser({
        ...currentUser,
        statPoints: currentUser.statPoints - node.spCost,
      });
    });

    if (success) {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSub}>SYSTEM DATABASE</Text>
          <Text style={styles.headerTitle}>SKILL TREES</Text>
        </View>
        <View style={styles.spIndicator}>
          <Text style={styles.spLabel}>AVAIL SP</Text>
          <Text style={styles.spValue}>{user.statPoints}</Text>
        </View>
      </View>

      {/* Tree Tabs */}
      <View style={styles.tabRow}>
        {TREE_TABS.map((tab) => {
          const isActive = activeTree === tab.key;
          return (
            <Pressable
              key={tab.key}
              style={[styles.tab, isActive && styles.tabActive]}
              onPress={() => {
                try {
                  Haptics.selectionAsync();
                } catch {}
                setActiveTree(tab.key);
              }}
            >
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                {tab.label}
              </Text>
              {isActive && <View style={styles.tabUnderline} />}
            </Pressable>
          );
        })}
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <LegendItem color={colors.textMuted} label="LOCKED" />
        <LegendItem color={colors.systemCyan} label="UNLOCKABLE" />
        <LegendItem color={colors.systemCyan} label="UNLOCKED" filled />
        <LegendItem color={colors.gold} label="VERIFIED" filled />
      </View>

      {/* Graph Scroll */}
      <ScrollView
        style={styles.graphScroll}
        contentContainerStyle={styles.graphContent}
        showsVerticalScrollIndicator={false}
      >
        <SkillGraph
          tree={activeTree}
          progress={skillProgress}
          availableSP={user.statPoints}
          onNodePress={handleNodePress}
        />
        {/* Bottom padding so last tier labels aren't clipped */}
        <View style={{ height: 80 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Legend Component ─────────────────────────────────────────────────────────

function LegendItem({
  color,
  label,
  filled = false,
}: {
  color: string;
  label: string;
  filled?: boolean;
}) {
  return (
    <View style={styles.legendItem}>
      <View
        style={[
          styles.legendDot,
          {
            borderColor: color,
            backgroundColor: filled ? color + '33' : 'transparent',
          },
        ]}
      />
      <Text style={styles.legendLabel}>{label}</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bgAbyss,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
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
  spIndicator: {
    backgroundColor: colors.bgPanel,
    borderWidth: 1,
    borderColor: colors.systemCyanDim,
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: 'center',
  },
  spLabel: {
    fontFamily: fonts.orbitronSemiBold,
    color: colors.systemCyanDim,
    fontSize: 9,
    letterSpacing: 1,
  },
  spValue: {
    fontFamily: fonts.jetBrainsMonoBold,
    color: colors.systemCyan,
    fontSize: 18,
  },
  tabRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.systemCyanDim,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    position: 'relative',
  },
  tabActive: {},
  tabLabel: {
    fontFamily: fonts.orbitronBold,
    color: colors.textMuted,
    fontSize: 11,
    letterSpacing: 1.5,
  },
  tabLabelActive: {
    color: colors.systemCyan,
  },
  tabUnderline: {
    position: 'absolute',
    bottom: 0,
    left: '15%',
    right: '15%',
    height: 2,
    backgroundColor: colors.systemCyan,
    borderRadius: radius.pill,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
  },
  legendLabel: {
    fontFamily: fonts.interMedium,
    color: colors.textMuted,
    fontSize: 9,
    letterSpacing: 0.5,
  },
  graphScroll: {
    flex: 1,
  },
  graphContent: {
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
  },
  // Node styles (absolute positioned within the graph view)
  nodeButton: {
    position: 'absolute',
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeLabel: {
    position: 'absolute',
    alignItems: 'center',
  },
  nodeLabelText: {
    fontFamily: fonts.interMedium,
    fontSize: 9,
    textAlign: 'center',
    letterSpacing: 0.3,
    lineHeight: 12,
  },
  nodeCostText: {
    fontFamily: fonts.jetBrainsMonoBold,
    color: colors.textMuted,
    fontSize: 8,
    marginTop: 1,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
});
