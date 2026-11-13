// Settings for the AZPM game layouts (AZPM Singles / Doubles / Commentary).
// Edit this file to change logos or timings; no other file needs to change.

/** Logos shown in the slideshow, in order. Paths are relative to the Stream Tool folder. */
export const sponsorLogos = [
    "Resources/AZPM/Overlay/Game Layouts/Logos/5PM Fights.png",
    "Resources/AZPM/Overlay/Game Layouts/Logos/FingerStripes.png",
    "Resources/AZPM/Overlay/Game Layouts/Logos/5PM Fights.png",
    "Resources/AZPM/Overlay/Game Layouts/Logos/PM Nexus.png",
    "Resources/AZPM/Overlay/Game Layouts/Logos/AZPM.png",
];

/** Time each logo stays on screen (milliseconds) */
export const sponsorInterval = 7000;

/** Time each caster social (twitter / twitch / youtube) stays on screen (milliseconds) */
export const socialInterval = 12000;

/** Order in which caster socials are shown; blank ones are skipped */
export const socialOrder = ["twitter", "twitch", "yt"];

/** Fade times for text changes (seconds) */
export const fadeInTime = .3;
export const fadeOutTime = .2;
