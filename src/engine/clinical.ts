// Pregnancy dating, anaemia classification and danger-sign detection.
// Pure functions. Thresholds come from config/clinical-thresholds.json.
import { THRESHOLDS, DANGER } from './data';

const DAY = 86_400_000;
const toUtcDay = (iso: string) => {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return Date.UTC(y, m - 1, d);
};
export const daysBetween = (fromIso: string, toIso: string) => Math.round((toUtcDay(toIso) - toUtcDay(fromIso)) / DAY);

export interface GestationalAge { totalDays: number; weeks: number; days: number; trimester: 1 | 2 | 3 }

/** Gestational age on a given date, from the due date (preferred) or the LMP. */
export function gestationalAge(on: string, opts: { dueDate?: string; lmpDate?: string }): GestationalAge {
  const term = THRESHOLDS.pregnancy.termDays;
  let totalDays: number;
  if (opts.dueDate) totalDays = term - daysBetween(on, opts.dueDate);
  else if (opts.lmpDate) totalDays = daysBetween(opts.lmpDate, on);
  else throw new Error('dueDate or lmpDate is required');
  const weeks = Math.floor(totalDays / 7);
  const t = THRESHOLDS.pregnancy.trimesterStartWeeks;
  const trimester: 1 | 2 | 3 = weeks >= t['3'] ? 3 : weeks >= t['2'] ? 2 : 1;
  return { totalDays, weeks, days: totalDays - weeks * 7, trimester };
}

/** Age in months as a decimal (WHO convention: days / 30.4375). */
export const ageInMonths = (dob: string, on: string) => daysBetween(dob, on) / 30.4375;

export type AnaemiaClass = 'normal' | 'mild' | 'moderate' | 'severe';
export type AnaemiaGroup = 'pregnant_t1' | 'pregnant_t2' | 'pregnant_t3' | 'nonpregnant_woman';
export type Urgency = 'none' | 'routine' | 'soon' | 'today';

export interface AnaemiaResult {
  group: AnaemiaGroup;
  classification: AnaemiaClass;
  urgency: Urgency;
  referralReason?: string;
}

export function anaemiaGroup(stage: 'pregnant' | 'not_pregnant', trimester?: 1 | 2 | 3): AnaemiaGroup {
  if (stage === 'not_pregnant') return 'nonpregnant_woman';
  if (!trimester) throw new Error('trimester is required for pregnant women');
  return `pregnant_t${trimester}` as AnaemiaGroup;
}

/** Classify a haemoglobin value in g/dL. Throws on implausible values so the UI can ask the mother to recheck. */
export function classifyHaemoglobin(hbGdl: number, group: AnaemiaGroup): AnaemiaResult {
  const cfg = THRESHOLDS.anaemia;
  if (!Number.isFinite(hbGdl) || hbGdl < cfg.plausibleRange.min || hbGdl > cfg.plausibleRange.max) {
    throw new RangeError('implausible_haemoglobin');
  }
  const g = cfg.groups[group];
  const classification: AnaemiaClass =
    hbGdl >= g.normalFrom ? 'normal' : hbGdl >= g.mildFrom ? 'mild' : hbGdl >= g.moderateFrom ? 'moderate' : 'severe';
  const action = cfg.actions[classification] as { urgency: Urgency; referralReason?: string };
  return { group, classification, urgency: action.urgency, referralReason: action.referralReason };
}

const normalise = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}\s']/gu, ' ').replace(/\s+/g, ' ').trim();

/** Rule-based check that runs BEFORE any AI call. Returns the matched terms (empty if none). */
export function detectDangerTerms(text: string): string[] {
  const t = ` ${normalise(text)} `;
  const all = [...DANGER.terms.en, ...DANGER.terms.pcm];
  return all.filter((term) => t.includes(` ${normalise(term)}`));
}
