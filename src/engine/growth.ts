// WHO Child Growth Standards z-scores (LMS method) and growth flags.
// Tables are monthly (age) or 0.5 cm (length); values between rows are linearly interpolated.
import { GROWTH_TABLES, THRESHOLDS, type GrowthIndicator, type LmsRow, type Sex } from './data';
import type { Urgency } from './clinical';
import { daysBetween } from './clinical';

function lmsAt(indicator: GrowthIndicator, sex: Sex, x: number): LmsRow {
  const rows = GROWTH_TABLES[indicator].sexes[sex].rows;
  if (x < rows[0].x || x > rows[rows.length - 1].x) throw new RangeError('outside_growth_table_range');
  let i = rows.findIndex((r) => r.x >= x);
  if (rows[i].x === x) return rows[i];
  const a = rows[i - 1], b = rows[i];
  const f = (x - a.x) / (b.x - a.x);
  const lerp = (k: keyof LmsRow) => a[k] + f * (b[k] - a[k]);
  return { x, L: lerp('L'), M: lerp('M'), S: lerp('S'), p2: lerp('p2'), p50: lerp('p50'), p98: lerp('p98') };
}

const valueAtZ = (r: LmsRow, z: number) => r.M * Math.pow(1 + r.L * r.S * z, 1 / r.L);

/**
 * z-score for a measurement.
 * x = age in months (age-based indicators) or length in cm (weightForLength).
 * Weight-based indicators use the WHO restricted application of the LMS method beyond +/-3 SD.
 */
export function zScore(indicator: GrowthIndicator, sex: Sex, x: number, value: number): number {
  const r = lmsAt(indicator, sex, x);
  let z = (Math.pow(value / r.M, r.L) - 1) / (r.L * r.S);
  const weightBased = indicator === 'weightForAge' || indicator === 'weightForLength';
  if (weightBased && z > 3) {
    const sd3 = valueAtZ(r, 3), sd23 = sd3 - valueAtZ(r, 2);
    z = 3 + (value - sd3) / sd23;
  } else if (weightBased && z < -3) {
    const sd3n = valueAtZ(r, -3), sd23n = valueAtZ(r, -2) - sd3n;
    z = -3 + (value - sd3n) / sd23n;
  }
  return Math.round(z * 100) / 100;
}

export interface GrowthFlag { id: string; indicator: string; z?: number; urgency: Urgency }

export interface Measurement { measuredOn: string; ageMonths: number; weightKg?: number; lengthCm?: number }

/** All z-scores and flags for one measurement. Implausible z-scores are reported so the UI can ask for a re-measure. */
export function assessGrowth(sex: Sex, m: Measurement) {
  const z: Partial<Record<GrowthIndicator, number>> = {};
  if (m.weightKg != null) z.weightForAge = zScore('weightForAge', sex, m.ageMonths, m.weightKg);
  if (m.lengthCm != null) z.lengthForAge = zScore('lengthForAge', sex, m.ageMonths, m.lengthCm);
  if (m.weightKg != null && m.lengthCm != null && m.lengthCm >= 45 && m.lengthCm <= 110)
    z.weightForLength = zScore('weightForLength', sex, m.lengthCm, m.weightKg);

  const implausible = Object.values(z).some((v) => Math.abs(v!) > THRESHOLDS.growth.implausibleZ);
  const flags: GrowthFlag[] = [];
  const seen = new Set<string>();
  for (const rule of THRESHOLDS.growth.flags as { id: string; indicator: GrowthIndicator; below?: number; above?: number; urgency: Urgency }[]) {
    const v = z[rule.indicator];
    if (v == null || seen.has(rule.id)) continue;
    if ((rule.below != null && v < rule.below) || (rule.above != null && v > rule.above)) {
      flags.push({ id: rule.id, indicator: rule.indicator, z: v, urgency: rule.urgency });
      seen.add(rule.id);
    }
  }
  return { z, flags, implausible };
}

/** Growth faltering: no weight gain between two measurements at least N days apart. */
export function checkFaltering(prev: Measurement, curr: Measurement): GrowthFlag | null {
  const cfg = THRESHOLDS.growth.faltering;
  if (prev.weightKg == null || curr.weightKg == null) return null;
  if (daysBetween(prev.measuredOn, curr.measuredOn) < cfg.minDaysBetween) return null;
  return curr.weightKg <= prev.weightKg ? { id: 'growth_faltering', indicator: 'weight', urgency: cfg.urgency as Urgency } : null;
}

/** Curves for charting: -3, -2, 0, +2, +3 SD across the table range. */
export function growthCurves(indicator: GrowthIndicator, sex: Sex) {
  return GROWTH_TABLES[indicator].sexes[sex].rows.map((r) => ({
    x: r.x, sdNeg3: valueAtZ(r, -3), sdNeg2: valueAtZ(r, -2), median: r.M, sd2: valueAtZ(r, 2), sd3: valueAtZ(r, 3),
  }));
}
