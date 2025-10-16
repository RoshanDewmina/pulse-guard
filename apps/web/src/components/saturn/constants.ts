/**
 * Saturn Design System - Theme Constants
 * Matches the home page aesthetic with warm, elegant colors
 */

export const colors = {
  // Primary Colors
  background: '#F7F5F3',
  primary: '#37322F',
  primaryHover: '#49423D',
  
  // Text Colors
  text: {
    primary: '#37322F',
    secondary: 'rgba(55,50,47,0.80)',
    muted: 'rgba(55,50,47,0.60)',
    disabled: 'rgba(55,50,47,0.40)',
  },
  
  // Border Colors
  border: {
    light: 'rgba(55,50,47,0.06)',
    default: 'rgba(55,50,47,0.08)',
    medium: 'rgba(55,50,47,0.12)',
  },
  
  // Status Colors
  status: {
    success: {
      bg: '#f0fdf4',
      border: '#86efac',
      text: '#166534',
    },
    warning: {
      bg: '#fefce8',
      border: '#fde047',
      text: '#854d0e',
    },
    error: {
      bg: '#fef2f2',
      border: '#fca5a5',
      text: '#991b1b',
    },
    info: {
      bg: '#eff6ff',
      border: '#93c5fd',
      text: '#1e40af',
    },
  },
  
  // Component Colors
  white: '#ffffff',
  gray: {
    50: '#fafaf9',
    100: '#f5f5f4',
    200: '#e7e5e4',
    300: '#d6d3d1',
  },
} as const;

export const shadows = {
  card: '0px_0px_0px_0.75px_rgba(50,45,43,0.12)',
  button: '0px_1px_2px_rgba(55,50,47,0.12)',
  nav: '0px_0px_0px_2px_white',
  subtle: '0px_4px_12px_rgba(55,50,47,0.12)',
} as const;

export const typography = {
  fontSans: 'var(--font-inter), ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
  fontSerif: 'var(--font-instrument-serif), ui-serif, serif',
} as const;

export const borderRadius = {
  sm: '0.375rem',
  md: '0.5rem',
  lg: '0.75rem',
  xl: '1rem',
  full: '9999px',
} as const;

export const spacing = {
  xs: '0.25rem',
  sm: '0.5rem',
  md: '1rem',
  lg: '1.5rem',
  xl: '2rem',
  '2xl': '3rem',
} as const;


