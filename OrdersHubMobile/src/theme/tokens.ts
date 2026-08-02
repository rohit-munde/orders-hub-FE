export const lightColors = {
  background: '#F8F8F6',
  surface: '#FFFFFF',
  text: '#0B0B0B',
  textMuted: '#929087',
  subtle: '#D9D7D1',
  border: '#E7E4DD',
  primary: '#0B0B0B',
  onPrimary: '#FFFFFF',
  onPrimaryMuted: '#B7B4AB',
  onMerchant: '#FFFFFF',
  danger: '#A23B3B',
  dangerSurface: '#FFF0F0',
  onDarkMuted: '#77756E',
  orderedText: '#64635E',
  orderedSurface: '#EEEDEA',
  inTransitText: '#955800',
  inTransitSurface: '#FFF0D6',
  outForDeliveryText: '#0E6A4D',
  outForDeliverySurface: '#E1F2EA',
  deliveredText: '#315C42',
  deliveredSurface: '#E8F1EA',
} as const;

export type ThemeColors = {
  [Color in keyof typeof lightColors]: string;
};

export const darkColors: ThemeColors = {
  background: '#111210',
  surface: '#1A1B18',
  text: '#F5F5F1',
  textMuted: '#A7A69F',
  subtle: '#55574F',
  border: '#34352F',
  primary: '#F5F5F1',
  onPrimary: '#111210',
  onPrimaryMuted: '#64655F',
  onMerchant: '#FFFFFF',
  danger: '#FF9A9A',
  dangerSurface: '#3A2020',
  onDarkMuted: '#A7A69F',
  orderedText: '#D1D0CA',
  orderedSurface: '#34352F',
  inTransitText: '#F4C06A',
  inTransitSurface: '#3B301D',
  outForDeliveryText: '#7ED6B4',
  outForDeliverySurface: '#18382E',
  deliveredText: '#9FD0AB',
  deliveredSurface: '#24372A',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radii = {
  md: 16,
  lg: 24,
  pill: 999,
} as const;

export const typography = {
  display: 42,
  title: 32,
  body: 18,
  label: 16,
  caption: 14,
} as const;

export const designTokens = { spacing, radii, typography } as const;
