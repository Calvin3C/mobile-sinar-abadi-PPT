// Sinar Abadi — Design System Tokens
export const Colors = {
  primary: '#e11d48',
  primaryDark: '#be123c',
  primaryLight: '#fecdd3',
  primaryBg: '#fff1f2',

  textMain: '#0f172a',
  textSecondary: '#475569',
  textMuted: '#64748b',
  textLight: '#94a3b8',

  background: '#f8fafc',
  card: '#ffffff',
  border: '#e2e8f0',
  borderLight: '#f1f5f9',
  divider: '#e2e8f0',

  success: '#10b981',
  successDark: '#059669',
  successBg: '#ecfdf5',

  warning: '#d97706',
  warningBg: '#fffbeb',

  danger: '#dc2626',
  dangerBg: '#fef2f2',

  info: '#0ea5e9',
  infoBg: '#f0f9ff',

  white: '#ffffff',
  black: '#000000',
  overlay: 'rgba(0,0,0,0.5)',
};

export const StatusColors: Record<string, { bg: string; text: string; label: string }> = {
  pending: { bg: '#fef3c7', text: '#92400e', label: 'Menunggu Konfirmasi' },
  success: { bg: '#fef3c7', text: '#92400e', label: 'Diproses' },
  shipping: { bg: '#fef3c7', text: '#92400e', label: 'Dikirim' },
  completed: { bg: '#dcfce7', text: '#166534', label: 'Selesai' },
  cancelled: { bg: '#fecaca', text: '#991b1b', label: 'Dibatalkan' },
};

export const Fonts = {
  // Font weights mapped to system fonts
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
};

export const FontSizes = {
  xs: 10,
  sm: 12,
  base: 14,
  md: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
};

export const Radius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  full: 9999,
};

export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
};

// Category icon mapping for the 12 material categories
export const CATEGORIES = [
  { id: 'semen', name: 'Semen', icon: 'package', filterValue: 'Semen' },
  { id: 'perpipaan', name: 'Perpipaan', icon: 'cylinder', filterValue: 'Perpipaan' },
  { id: 'cat-tembok', name: 'Cat Tembok', icon: 'paintbrush', filterValue: 'Cat Tembok' },
  { id: 'cat-kayu', name: 'Cat Kayu', icon: 'paintbrush-2', filterValue: 'Cat Kayu' },
  { id: 'besi-beton', name: 'Besi Beton', icon: 'construction', filterValue: 'Besi Beton' },
  { id: 'kloset', name: 'Kloset', icon: 'bath', filterValue: 'Kloset' },
  { id: 'perkakas', name: 'Perkakas', icon: 'wrench', filterValue: 'Perkakas' },
  { id: 'listrik', name: 'Listrik', icon: 'zap', filterValue: 'Listrik' },
  { id: 'kuas-cat', name: 'Kuas Cat', icon: 'brush', filterValue: 'Kuas Cat' },
  { id: 'kunci-pintu', name: 'Kunci Pintu', icon: 'key-round', filterValue: 'Kunci Pintu' },
  { id: 'engsel', name: 'Engsel', icon: 'door-open', filterValue: 'Engsel' },
  { id: 'keramik', name: 'Keramik & Granite', icon: 'grid-3x3', filterValue: 'Keramik & Granite' },
] as const;
