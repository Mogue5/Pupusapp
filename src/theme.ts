export const colors = {
  background: '#F5F0E8',
  surface: '#FEFCF8',
  primary: '#D4793A',
  primaryLight: '#F5E6D3',
  brown: '#5C3D2E',
  brownLight: '#7A5A4A',
  golden: '#E8B84B',
  goldenLight: '#F2D88A',
  text: '#3D2B1F',
  textSecondary: '#7A5A4A',
  textMuted: '#B8A090',
  border: '#D9CDBF',
  arroz: '#F5E6D3',
  maiz: '#F9E8A0',
  arrozText: '#7A5A4A',
  maizText: '#8B7520',
  chip: '#EDE6DA',
  chipActive: '#5C3D2E',
  chipActiveText: '#FEFCF8',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
};

export const fontFamily = {
  regular: 'Nunito_400Regular',
  medium: 'Nunito_500Medium',
  semiBold: 'Nunito_600SemiBold',
  bold: 'Nunito_700Bold',
  extraBold: 'Nunito_800ExtraBold',
};

export const fonts = {
  regular: { fontSize: 16, color: colors.text, fontFamily: fontFamily.regular },
  small: { fontSize: 14, color: colors.textSecondary, fontFamily: fontFamily.regular },
  heading: { fontSize: 28, fontFamily: fontFamily.extraBold, color: colors.brown },
  subheading: { fontSize: 12, fontFamily: fontFamily.bold, color: colors.textMuted, letterSpacing: 1 },
};
