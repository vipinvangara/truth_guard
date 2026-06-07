/**
 * TruthGuard Design System — Slate-based light theme
 * Warmer, softer light mode using a slate blue-gray palette.
 * All backgrounds are muted gray-blue, not pure white.
 * High contrast ratios throughout for accessibility.
 */
export const Colors = {
  // ─── Page & Surface ───────────────────────────────────────────────
  background: '#E9EDF4',      // Cool blue-gray page (not white)
  cardBg: '#F4F6FA',          // Soft off-white cards
  cardBgAlt: '#EBEEF5',       // Slightly darker nested card surface
  cardBgDark: '#1A2340',      // Dark navy card (action card, modal headers)

  // ─── Brand ────────────────────────────────────────────────────────
  primary: '#1E3A8A',         // Deep trust navy — CTAs, active nav, headings
  primaryMid: '#2563EB',      // Medium blue — links, icons
  primaryLight: '#DBEAFE',    // Light blue tint — icon backgrounds, badges
  primaryBorder: '#BFDBFE',   // Blue border

  // ─── Status: Danger ───────────────────────────────────────────────
  danger: '#B91C1C',          // Deep red (high contrast on light bg)
  dangerBg: '#FEF2F2',        // Very light red surface
  dangerBorder: '#FECACA',    // Red border

  // ─── Status: Success ──────────────────────────────────────────────
  success: '#15803D',         // Forest green
  successBg: '#F0FDF4',       // Very light green surface
  successBorder: '#BBF7D0',   // Green border

  // ─── Status: Warning ──────────────────────────────────────────────
  warning: '#B45309',         // Amber (readable on light)
  warningBg: '#FFFBEB',       // Light amber surface
  warningBorder: '#FDE68A',   // Amber border

  // ─── Neutral accents (replaces "info" cyan) ───────────────────────
  info: '#2563EB',            // Same as primaryMid for consistency

  // ─── Text ─────────────────────────────────────────────────────────
  text: '#0F172A',            // Near-black slate (WCAG AAA on light bg)
  textMuted: '#475569',       // Slate-600 — secondary text
  textLight: '#94A3B8',       // Slate-400 — hints, placeholders

  // ─── Borders & Dividers ───────────────────────────────────────────
  border: '#CBD5E1',          // Slate-300 — clearly visible but not harsh
  borderMedium: '#94A3B8',    // Slate-400 — stronger dividers

  // ─── Shadows ──────────────────────────────────────────────────────
  shadowColor: '#0F172A',

  // ─── Nav ──────────────────────────────────────────────────────────
  navBg: '#F4F6FA',
  navBorder: '#CBD5E1',

  // ─── Legacy aliases (keeps older screens from crashing) ───────────
  pulseGlow: 'rgba(21, 128, 61, 0.15)',
  dangerGlow: 'rgba(185, 28, 28, 0.15)',
  infoGlow: 'rgba(37, 99, 235, 0.15)',
};

export const Typography = {
  titleLarge: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.5,
  },
  titleMedium: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
  },
  headerText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
  },
  bodyText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 22,
  },
  bodyMuted: {
    fontSize: 13,
    color: Colors.textMuted,
    lineHeight: 20,
  },
  codeText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: Colors.primary,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
    letterSpacing: 0.2,
  }
};

export const Shadows = {
  card: {
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  cardMd: {
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  cardLg: {
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 6,
  }
};
