import colors from '../constants/colors';

const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

const typography = {
  heading: {
    fontSize: 24,
    fontWeight: '700' as const,
    lineHeight: 32,
  },
  subheading: {
    fontSize: 18,
    fontWeight: '600' as const,
    lineHeight: 24,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 22,
  },
  caption: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 18,
  },
  label: {
    fontSize: 12,
    fontWeight: '500' as const,
    lineHeight: 16,
  },
};

const theme = {
  colors,
  spacing,
  typography,
};

export type Theme = typeof theme;

export default theme;
