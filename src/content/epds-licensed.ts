// Paste the licensed EPDS wording here ONLY after written permission from the Royal College of Psychiatrists.
// Keep the original order of items and options exactly. Any Pidgin version must be a properly translated and,
// ideally, validated version before it is used for screening.
export interface EpdsItem { n: number; text: string; options: [string, string, string, string] }
export const EPDS_LICENSED: { intro: string; items: EpdsItem[] } | null = null;
