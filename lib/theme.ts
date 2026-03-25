// Pet Yuka — Design Tokens (from DESIGN.md)

export const colors = {
  primary: '#0D9488',
  primaryHover: '#0F766E',
  primaryLight: '#CCFBF1',
  surface: '#FAFAF8',
  surfaceElevated: '#FFFFFF',
  textPrimary: '#1C1917',
  textSecondary: '#57534E',
  textMuted: '#A8A29E',
  border: '#E7E5E4',
  borderLight: '#F5F5F0',
  score: {
    good: '#43A047',
    ok: '#7CB342',
    poor: '#FB8C00',
    bad: '#E53935',
  },
  semantic: {
    success: '#43A047',
    warning: '#FB8C00',
    error: '#E53935',
    info: '#0D9488',
  },
} as const;

export const darkColors = {
  ...colors,
  primary: '#2DD4BF',
  primaryHover: '#14B8A6',
  primaryLight: '#134E4A',
  surface: '#1C1917',
  surfaceElevated: '#292524',
  textPrimary: '#FAFAF9',
  textSecondary: '#D6D3D1',
  textMuted: '#78716C',
  border: '#44403C',
  borderLight: '#292524',
} as const;

export const spacing = {
  '2xs': 2,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
} as const;

export const radius = {
  sm: 4,
  md: 8,
  lg: 12,
  full: 9999,
} as const;

export const typography = {
  displayXl: { fontSize: 36, fontWeight: '800' as const },
  display: { fontSize: 28, fontWeight: '700' as const },
  heading: { fontSize: 20, fontWeight: '700' as const },
  subheading: { fontSize: 16, fontWeight: '600' as const },
  body: { fontSize: 16, fontWeight: '400' as const },
  bodySmall: { fontSize: 14, fontWeight: '400' as const },
  caption: { fontSize: 13, fontWeight: '500' as const },
  scoreNumber: { fontSize: 42, fontWeight: '600' as const },
  data: { fontSize: 14, fontWeight: '500' as const },
} as const;
