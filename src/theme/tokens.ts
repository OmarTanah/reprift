export const colors = {
  bgAbyss: '#05060E',
  bgPanel: '#0A0C1A',
  bgElevated: '#111427',
  systemCyan: '#00E5FF',
  systemCyanDim: '#0A6E7A',
  violetCore: '#5A4FF9',
  danger: '#FF3860',
  success: '#39FF88',
  gold: '#FFC940',
  textPrimary: '#EAF6FF',
  textMuted: '#7A8299',
  textSystem: '#00E5FF',
  glowGradient: ['#00E5FF', '#5A4FF9'] as const,
};

export const fonts = {
  orbitronBold: 'Orbitron_700Bold',
  orbitronSemiBold: 'Orbitron_600SemiBold',
  interRegular: 'Inter_400Regular',
  interMedium: 'Inter_500Medium',
  jetBrainsMonoBold: 'JetBrainsMono_700Bold',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  hero: 48,
};

export const radius = {
  sm: 6,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 9999,
};

export const borders = {
  holographic: {
    borderWidth: 1,
    borderColor: colors.systemCyanDim,
  },
  activeCyan: {
    borderWidth: 1,
    borderColor: colors.systemCyan,
  },
};
