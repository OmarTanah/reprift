import AnimatedGlow, { type PresetConfig } from 'react-native-animated-glow';
import { BlurMask, Canvas, Path, Skia, RoundedRect } from '@shopify/react-native-skia';
import React, { useMemo, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View, ViewProps } from 'react-native';
import { colors, radius } from '../theme/tokens';

interface SystemPanelProps extends ViewProps {
  glow?: boolean;
  glowColor?: string;
  showCornerBrackets?: boolean;
  children: React.ReactNode;
}

export const SystemPanel: React.FC<SystemPanelProps> = ({
  glow = true,
  glowColor = colors.systemCyan,
  showCornerBrackets = true,
  children,
  style,
  ...rest
}) => {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const preset = useMemo<PresetConfig>(
    () => ({
      metadata: {
        name: 'RepRift System Panel',
        textColor: colors.textPrimary,
        category: 'System',
        tags: ['panel', 'holographic'],
      },
      states: [
        {
          name: 'default',
          preset: {
            cornerRadius: radius.md,
            outlineWidth: 1,
            borderColor: glowColor,
            backgroundColor: colors.bgPanel,
            animationSpeed: 1,
            glowLayers: glow
              ? [
                  {
                    colors: [glowColor],
                    opacity: 0.4,
                    glowSize: 10,
                    speedMultiplier: 1,
                    glowPlacement: 'behind',
                    coverage: 1,
                  },
                ]
              : [],
          },
        },
      ],
    }),
    [glow, glowColor]
  );

  const cornerPath = useMemo(() => {
    if (size.width === 0 || size.height === 0) return null;

    const cornerSize = 8;
    const edge = 1;
    const right = size.width - edge;
    const bottom = size.height - edge;

    return Skia.Path.MakeFromSVGString(
      `M ${edge + cornerSize} ${edge} H ${edge} V ${edge + cornerSize}` +
        ` M ${right - cornerSize} ${edge} H ${right} V ${edge + cornerSize}` +
        ` M ${edge} ${bottom - cornerSize} V ${bottom} H ${edge + cornerSize}` +
        ` M ${right - cornerSize} ${bottom} H ${right} V ${bottom - cornerSize}`
    );
  }, [size]);

  const handleLayout = (event: LayoutChangeEvent) => {
    setSize({
      width: event.nativeEvent.layout.width,
      height: event.nativeEvent.layout.height,
    });
    rest.onLayout?.(event);
  };

  return (
    <AnimatedGlow preset={preset} wrapperStyle={styles.glowWrapper}>
      <View style={[styles.panel, style]} {...rest} onLayout={handleLayout}>
        {children}
        {showCornerBrackets && cornerPath && (
          <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
            <RoundedRect
              x={1}
              y={1}
              width={size.width - 2}
              height={size.height - 2}
              r={radius.md}
              color={glowColor}
              style="stroke"
              strokeWidth={1}
            >
              <BlurMask blur={6} style="outer" />
            </RoundedRect>
            <Path path={cornerPath} color={glowColor} style="stroke" strokeWidth={2} />
          </Canvas>
        )}
      </View>
    </AnimatedGlow>
  );
};

const styles = StyleSheet.create({
  glowWrapper: {
    width: '100%',
  },
  panel: {
    backgroundColor: colors.bgPanel,
    borderWidth: 1,
    borderColor: colors.systemCyanDim,
    borderRadius: radius.md,
    padding: 16,
    position: 'relative',
    overflow: 'visible',
  },
});
