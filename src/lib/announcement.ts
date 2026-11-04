/**
 * Application copy and constants.
 */
export const ANNOUNCEMENT = {
  headline: "Built for the KTU community.",
  tagline: "Question papers, notes and study material, arranged by semester and subject.",
  support: "Help build a shared academic resource library for KTU students.",
} as const;

/** The developer details. */
export const DEVELOPER = {
  name: "Sreesanth",
  github: "notstr0y",
  url: "https://github.com/notstr0y",
} as const;

export const DEVELOPER_CREDIT = `Developed by ${DEVELOPER.name}`;

/** Intentionally Malayalam copy is written in Malayalam script. */
export const RANGA_EMPTY_DIALOGUE = "ഡാ മോനേ, രംഗൻ ചേട്ടൻ കാണിക്കും എന്ന് പറഞ്ഞാ കാണിക്കും!";
export const RELEASE_LABEL = `RELEASE @ v${__APP_VERSION__}`;
