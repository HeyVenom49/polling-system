import type { UserPlan } from "./constants";

export const POLL_THEME_IDS = [
  "ocean",
  "sunset",
  "midnight",
  "paper",
  "berry",
  "meadow",
  "aurora",
  "slate",
  "citrus",
  "noir",
  "bloom",
] as const;

export type PollThemeId = (typeof POLL_THEME_IDS)[number];

export const DEFAULT_POLL_THEME_ID: PollThemeId = "ocean";

/** Selectable on Free without upgrade. */
export const FREE_POLL_THEME_IDS = [
  "ocean",
  "sunset",
  "midnight",
  "paper",
  "berry",
  "meadow",
] as const satisfies readonly PollThemeId[];

/** Visible to Free (locked), unlocked on Pro. */
export const PRO_POLL_THEME_IDS = [
  "aurora",
  "slate",
  "citrus",
  "noir",
  "bloom",
] as const satisfies readonly PollThemeId[];

export type PollThemeTokens = {
  id: PollThemeId;
  label: string;
  description: string;
  /** CSS custom properties applied to the take-poll / results surface */
  cssVars: {
    "--poll-bg": string;
    "--poll-surface": string;
    "--poll-text": string;
    "--poll-muted": string;
    "--poll-accent": string;
    "--poll-accent-text": string;
    "--poll-border": string;
  };
};

export const POLL_THEMES: Record<PollThemeId, PollThemeTokens> = {
  ocean: {
    id: "ocean",
    label: "Ocean",
    description: "Deep navy with teal accents",
    cssVars: {
      "--poll-bg": "#E8F1F5",
      "--poll-surface": "#FFFFFF",
      "--poll-text": "#0B3D5C",
      "--poll-muted": "#5A7A8C",
      "--poll-accent": "#2BB3A3",
      "--poll-accent-text": "#053042",
      "--poll-border": "#C5D8E2",
    },
  },
  sunset: {
    id: "sunset",
    label: "Sunset",
    description: "Warm coral on soft peach",
    cssVars: {
      "--poll-bg": "#FFF1E8",
      "--poll-surface": "#FFFFFF",
      "--poll-text": "#4A2C1A",
      "--poll-muted": "#9A6B52",
      "--poll-accent": "#E86F4A",
      "--poll-accent-text": "#FFFFFF",
      "--poll-border": "#F0D0C0",
    },
  },
  midnight: {
    id: "midnight",
    label: "Midnight",
    description: "Charcoal with lime marks",
    cssVars: {
      "--poll-bg": "#12141A",
      "--poll-surface": "#1C1F28",
      "--poll-text": "#E8EAEF",
      "--poll-muted": "#9AA0B0",
      "--poll-accent": "#B8E63A",
      "--poll-accent-text": "#12141A",
      "--poll-border": "#2E3340",
    },
  },
  paper: {
    id: "paper",
    label: "Paper",
    description: "Ink on off-white form paper",
    cssVars: {
      "--poll-bg": "#F7F4EE",
      "--poll-surface": "#FFFDF8",
      "--poll-text": "#1A1A1A",
      "--poll-muted": "#6B6B6B",
      "--poll-accent": "#1A1A1A",
      "--poll-accent-text": "#F7F4EE",
      "--poll-border": "#D9D2C5",
    },
  },
  berry: {
    id: "berry",
    label: "Berry",
    description: "Magenta accents on cool gray",
    cssVars: {
      "--poll-bg": "#F3F0F5",
      "--poll-surface": "#FFFFFF",
      "--poll-text": "#2D1B33",
      "--poll-muted": "#7A6A82",
      "--poll-accent": "#C2185B",
      "--poll-accent-text": "#FFFFFF",
      "--poll-border": "#DDD0E0",
    },
  },
  meadow: {
    id: "meadow",
    label: "Meadow",
    description: "Soft green wash with leaf accents",
    cssVars: {
      "--poll-bg": "#EEF6EF",
      "--poll-surface": "#FFFFFF",
      "--poll-text": "#1B4332",
      "--poll-muted": "#5C7A68",
      "--poll-accent": "#40916C",
      "--poll-accent-text": "#FFFFFF",
      "--poll-border": "#C8DDCE",
    },
  },
  aurora: {
    id: "aurora",
    label: "Aurora",
    description: "Cool night sky with electric cyan",
    cssVars: {
      "--poll-bg": "#0F1C2E",
      "--poll-surface": "#162338",
      "--poll-text": "#E8F4FF",
      "--poll-muted": "#8BA3BC",
      "--poll-accent": "#3DDCFF",
      "--poll-accent-text": "#041018",
      "--poll-border": "#2A3F5A",
    },
  },
  slate: {
    id: "slate",
    label: "Slate",
    description: "Quiet gray studio with steel blue",
    cssVars: {
      "--poll-bg": "#ECEFF3",
      "--poll-surface": "#FFFFFF",
      "--poll-text": "#1E293B",
      "--poll-muted": "#64748B",
      "--poll-accent": "#475569",
      "--poll-accent-text": "#F8FAFC",
      "--poll-border": "#CBD5E1",
    },
  },
  citrus: {
    id: "citrus",
    label: "Citrus",
    description: "Bright lemon on warm cream",
    cssVars: {
      "--poll-bg": "#FFF9E8",
      "--poll-surface": "#FFFFFF",
      "--poll-text": "#3D2E0A",
      "--poll-muted": "#8A7340",
      "--poll-accent": "#E5A100",
      "--poll-accent-text": "#1A1400",
      "--poll-border": "#F0DFB0",
    },
  },
  noir: {
    id: "noir",
    label: "Noir",
    description: "High-contrast black with gold marks",
    cssVars: {
      "--poll-bg": "#0A0A0A",
      "--poll-surface": "#161616",
      "--poll-text": "#F5F5F5",
      "--poll-muted": "#A3A3A3",
      "--poll-accent": "#D4AF37",
      "--poll-accent-text": "#0A0A0A",
      "--poll-border": "#2A2A2A",
    },
  },
  bloom: {
    id: "bloom",
    label: "Bloom",
    description: "Soft rose with blossom accents",
    cssVars: {
      "--poll-bg": "#FCF0F3",
      "--poll-surface": "#FFFFFF",
      "--poll-text": "#4A1D2E",
      "--poll-muted": "#9A6B7C",
      "--poll-accent": "#E85A7A",
      "--poll-accent-text": "#FFFFFF",
      "--poll-border": "#EBCAD4",
    },
  },
};

/** Ballotly product chrome (dashboard / marketing) — Ocean palette */
export const APP_THEME = {
  name: "Ocean",
  cssVars: {
    "--color-bg": "#F3F7FA",
    "--color-surface": "#FFFFFF",
    "--color-text": "#0B3D5C",
    "--color-muted": "#5A7A8C",
    "--color-primary": "#0B3D5C",
    "--color-accent": "#2BB3A3",
    "--color-accent-hover": "#249E90",
    "--color-border": "#D0DEE6",
    "--color-danger": "#C62828",
    "--font-display": '"Syne", system-ui, sans-serif',
    "--font-body": '"Figtree", system-ui, sans-serif',
  },
} as const;

export function getPollTheme(themeId: string): PollThemeTokens {
  if (themeId in POLL_THEMES) {
    return POLL_THEMES[themeId as PollThemeId];
  }
  return POLL_THEMES[DEFAULT_POLL_THEME_ID];
}

export function isProPollTheme(themeId: string): boolean {
  return (PRO_POLL_THEME_IDS as readonly string[]).includes(themeId);
}

export function canUsePollTheme(
  themeId: string,
  plan: UserPlan | undefined,
): boolean {
  if (!isProPollTheme(themeId)) {
    return true;
  }
  return plan === "pro";
}

export function canUsePollExpiry(plan: UserPlan | undefined): boolean {
  return plan === "pro";
}

export function canRequirePollAuthentication(
  plan: UserPlan | undefined,
): boolean {
  return plan === "pro";
}
