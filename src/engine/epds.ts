// Edinburgh Postnatal Depression Scale (EPDS) scoring.
// Cox JL, Holden JM, Sagovsky R (1987). Detection of postnatal depression: development of the 10-item
// Edinburgh Postnatal Depression Scale. British Journal of Psychiatry 150:782-786. (c) 1987 The Royal College of Psychiatrists.
// The item wording is NOT included in this repository: online republication needs written permission from the
// Royal College of Psychiatrists. Once permission is granted, the licensed wording goes in content/epds-licensed.ts.
// Scoring rules and cut-offs below are configurable and need clinical lead sign-off.

/** Items whose options run from 0 (first option) to 3 (last option). All other items are reverse scored (3 to 0). */
export const EPDS_FORWARD_ITEMS = [1, 2, 4];
export const EPDS_CONFIG = {
  possibleFrom: 10,   // 10 to 12: possible depression, repeat screen and offer support
  likelyFrom: 13,     // 13 or more: likely depression, refer to a clinician
  selfHarmItem: 10,   // any score above 0 on item 10 triggers the safety pathway immediately
  scheduleDays: [14, 42, 90, 182, 273, 365],
  windowDays: 7,
};

/** answers: option index chosen (0 = first option shown) for items 1 to 10. */
export function scoreEpds(answers: Record<number, number>) {
  let total = 0;
  for (let item = 1; item <= 10; item++) {
    const pick = answers[item];
    if (pick == null || pick < 0 || pick > 3) throw new Error(`EPDS item ${item} unanswered`);
    total += EPDS_FORWARD_ITEMS.includes(item) ? pick : 3 - pick;
  }
  const item10 = 3 - answers[EPDS_CONFIG.selfHarmItem];
  const band: 'low' | 'possible' | 'likely' = total >= EPDS_CONFIG.likelyFrom ? 'likely' : total >= EPDS_CONFIG.possibleFrom ? 'possible' : 'low';
  return { total, band, selfHarm: item10 > 0 };
}

/** Is a screen due today, given the baby's age in days and the dates of past screens (as baby-age days)? */
export function epdsDue(babyDay: number, doneAtDays: number[]) {
  const target = EPDS_CONFIG.scheduleDays.find((d) => babyDay >= d - EPDS_CONFIG.windowDays && babyDay <= d + 21);
  if (target == null) return null;
  const already = doneAtDays.some((d) => d >= target - EPDS_CONFIG.windowDays);
  return already ? null : target;
}
