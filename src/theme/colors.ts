// Luxury Convoy Design System — Curated high-contrast palette
// Deep obsidian typography, warm terracotta primary, sapphire trust accents,
// and clean multi-tier surface elevations for a world-class bespoke look.

export const colors = {
  // Canvases & Surfaces
  canvas: "#F7F8F4",
  canvasSubtle: "#EFEFEA",
  paper: "#FFFFFF",
  paperRaised: "#FFFFFF",
  surfaceSubtle: "#F3F4EE",
  surfaceElevated: "#FFFFFF",
  surfaceGlass: "rgba(255, 255, 255, 0.88)",
  surfaceDark: "#121A15",

  // Inks & Typography
  ink: "#111814",
  inkMuted: "#39463D",
  inkSoft: "#637167",
  inkSubtle: "#919E95",
  inkLight: "#FFFFFF",

  // Borders & Dividers
  line: "#E3E6DC",
  lineLight: "#ECEFE5",
  lineFocus: "#C8452D",
  lineGlass: "rgba(255, 255, 255, 0.7)",

  // Brand Accent (Luxury Terracotta & Amber Warmth)
  accent: "#C8452D",
  accentHover: "#B03A24",
  accentLight: "#FDEEEB",
  accentGlow: "rgba(200, 69, 45, 0.18)",
  accentInk: "#882815",

  // Trust & Security (Sapphire Slate)
  trust: "#1E5F74",
  trustLight: "#EAF3F7",
  trustGlow: "rgba(30, 95, 116, 0.18)",
  trustInk: "#123F4E",

  // Gold & Premium Badges
  gold: "#D97706",
  goldLight: "#FEF3C7",
  goldInk: "#92400E",

  // Status Indicators
  statusVerified: "#15803D",
  statusVerifiedLight: "#DCFCE7",
  statusPending: "#D97706",
  statusPendingLight: "#FEF3C7",
  statusFlagged: "#DC2626",
  statusFlaggedLight: "#FEE2E2",
  statusOff: "#9CA3AF",
} as const;

export type ColorToken = keyof typeof colors;
