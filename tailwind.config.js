/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        'bg-abyss': '#05060E',
        'bg-panel': '#0A0C1A',
        'bg-elevated': '#111427',
        'system-cyan': '#00E5FF',
        'system-cyan-dim': '#0A6E7A',
        'violet-core': '#5A4FF9',
        danger: '#FF3860',
        success: '#39FF88',
        gold: '#FFC940',
        'text-primary': '#EAF6FF',
        'text-muted': '#7A8299',
        'text-system': '#00E5FF',
      },
      fontFamily: {
        orbitron: ['Orbitron_700Bold', 'sans-serif'],
        'orbitron-semibold': ['Orbitron_600SemiBold', 'sans-serif'],
        inter: ['Inter_400Regular', 'sans-serif'],
        'inter-medium': ['Inter_500Medium', 'sans-serif'],
        'jetbrains-mono': ['JetBrainsMono_700Bold', 'monospace'],
      },
      borderRadius: {
        sm: '6px',
        md: '12px',
        lg: '16px',
        xl: '24px',
        pill: '9999px',
      },
    },
  },
  plugins: [],
};
