/**
 * Fleet Logistics SaaS Color System
 *
 * This file provides a reference for the semantic color tokens used throughout the app.
 * All colors support both light and dark modes via CSS variables defined in globals.css.
 *
 * Usage: Apply these as Tailwind classes (e.g., `bg-primary`, `text-success`)
 */

export const colorTokens = {
  // Primary brand colors
  primary: {
    light: "primary-light", // #63A4FF (light mode) / lighter blue (dark mode)
    DEFAULT: "primary", // #1976D2 (light mode) / #58A6FF (dark mode)
    dark: "primary-dark", // #0D47A1 (both modes)
  },

  // Secondary/accent colors
  secondary: {
    light: "secondary-light", // #52C7B8 (light mode) / lighter teal (dark mode)
    DEFAULT: "secondary", // #009688 (light mode) / #3FB6A8 (dark mode)
    dark: "secondary-dark", // #00695C (both modes)
  },

  // Semantic status colors
  success: "success", // #2E7D32
  warning: "warning", // #ED6C02
  error: "destructive", // #D32F2F
  info: "info", // #0288D1

  // Surface & background
  background: "background", // #F7F9FC (light) / #0D1117 (dark)
  surface: "card", // #FFFFFF (light) / #161B22 (dark)
  surfaceElevated: "ui-surface-elevated", // #FFFFFF (light) / #2a2d3a approx (dark)
  surfaceHover: "ui-surface-hover", // #F7F9FC lighter (light) / #353845 approx (dark)

  // Text
  textPrimary: "foreground", // #1A1F36 (light) / #E6EDF3 (dark)
  textSecondary: "muted-foreground", // #6B7280 (light) / #8B949E (dark)

  // Borders & inputs
  border: "border", // #E0E6EF (light) / #30363D (dark)
  input: "input", // #E0E6EF (light) / #30363D (dark)

  // Chart/visualization colors (route colors)
  chart: {
    1: "chart-1", // #4CAF50 - route-a (green)
    2: "chart-2", // #FFB300 - route-b (amber)
    3: "chart-3", // #7E57C2 - route-c (purple)
    4: "chart-4", // #F4511E - route-d (deep orange)
    5: "chart-5", // #29B6F6 - route-e (light blue)
  },

  // Sidebar-specific (inherits from surface/background)
  sidebar: {
    background: "sidebar",
    foreground: "sidebar-foreground",
    primary: "sidebar-primary",
    accent: "sidebar-accent",
    border: "sidebar-border",
  },
} as const;

/**
 * Visual chart/map colors array for programmatic use
 * These map to the route colors (chart-1 through chart-5)
 */
export const visualColors = [
  "#4CAF50", // route-a / chart-1
  "#FFB300", // route-b / chart-2
  "#7E57C2", // route-c / chart-3
  "#F4511E", // route-d / chart-4
  "#29B6F6", // route-e / chart-5
] as const;

/**
 * HSL color values for direct CSS variable access
 * Use these if you need to programmatically access the raw HSL values
 */
export const hslValues = {
  light: {
    primary: "215 84% 49%",
    secondary: "174 100% 29%",
    background: "216 50% 97%",
    surface: "0 0% 100%",
    border: "217 25% 91%",
    textPrimary: "225 45% 15%",
    textSecondary: "220 14% 47%",
    success: "123 42% 33%",
    warning: "24 96% 47%",
    error: "4 72% 50%",
    info: "199 91% 41%",
  },
  dark: {
    primary: "215 100% 67%",
    secondary: "174 48% 55%",
    background: "215 28% 7%",
    surface: "215 15% 12%",
    border: "215 15% 21%",
    textPrimary: "213 31% 91%",
    textSecondary: "217 11% 57%",
    success: "123 42% 33%",
    warning: "24 96% 47%",
    error: "4 72% 50%",
    info: "199 91% 41%",
  },
} as const;
