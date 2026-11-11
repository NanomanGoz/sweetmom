// Spec section 11 test cases. Clinical lead confirms the anaemia and growth cases against the WHO sources.
import { describe, it, expect } from 'vitest';
import {
  gestationalAge, classifyHaemoglobin, anaemiaGroup, detectDangerTerms, ageInMonths,
  zScore, assessGrowth, checkFaltering, GROWTH_TABLES,
  expandMeal, nutrientTotals, womenFoodGroups, childFoodGroups, exclusivelyBreastfed, iycfIndicators,
  FOODS, MEALS, FOOD_BY_ID,
} from './index';

const hb = (v: number, weeks: number | null) => {
  if (weeks == null) return classifyHaemoglobin(v, anaemiaGroup('not_pregnant'));
  const lmp = new Date(Date.UTC(2026, 0, 1));
  const on = new Date(lmp.getTime() + weeks * 7 * 86400000).toISOString().slice(0, 10);
  const ga = gestationalAge(on, { lmpDate: '2026-01-01' });
  return classifyHaemoglobin(v, anaemiaGroup('pregnant', ga.trimester));
};

describe('pregnancy dating', () => {
  it('computes gestational age from due date', () => {
    const ga = gestationalAge('2026-11-07', { dueDate: '2027-02-13' });
    expect(ga.weeks).toBe(26);
    expect(ga.trimester).toBe(2);
  });
  it('trimester boundaries at 14 and 28 weeks', () => {
    expect(gestationalAge('2026-04-09', { lmpDate: '2026-01-01' }).trimester).toBe(2); // 14w0d
    expect(gestationalAge('2026-04-08', { lmpDate: '2026-01-01' }).trimester).toBe(1); // 13w6d
    expect(gestationalAge('2026-07-16', { lmpDate: '2026-01-01' }).trimester).toBe(3); // 28w0d
  });
});

describe('anaemia (cases 1-6)', () => {
  it('1: 24 weeks, Hb 9.2 -> moderate, soon', () => {
    const r = hb(9.2, 24);
    expect(r.group).toBe('pregnant_t2');
    expect(r.classification).toBe('moderate');
    expect(r.urgency).toBe('soon');
    expect(r.referralReason).toBe('anaemia_moderate');
  });
  it('2: 10 weeks, Hb 10.5 -> mild, routine', () => {
    expect(hb(10.5, 10)).toMatchObject({ group: 'pregnant_t1', classification: 'mild', urgency: 'routine' });
  });
  it('3: 20 weeks, Hb 10.6 -> normal (2nd trimester cutoff 10.5)', () => {
    expect(hb(10.6, 20)).toMatchObject({ classification: 'normal', urgency: 'none' });
  });
  it('4: 32 weeks, Hb 6.8 -> severe, today', () => {
    expect(hb(6.8, 32)).toMatchObject({ group: 'pregnant_t3', classification: 'severe', urgency: 'today' });
  });
  it('5: breastfeeding, Hb 11.5 -> mild', () => {
    expect(hb(11.5, null)).toMatchObject({ group: 'nonpregnant_woman', classification: 'mild' });
  });
  it('6: breastfeeding, Hb 7.9 -> severe', () => {
    expect(hb(7.9, null)).toMatchObject({ classification: 'severe', urgency: 'today' });
  });
  it('rejects implausible values', () => {
    expect(() => hb(92, 24)).toThrow('implausible_haemoglobin');
  });
});

describe('food groups (cases 7 and 10)', () => {
  it('7: eba + egusi with ugu + orange reaches MDD-W', () => {
    const day = [...expandMeal('eba_egusi_ugu'), { foodId: 'orange', grams: 130 }];
    const r = womenFoodGroups(day);
    expect(r.groups).toEqual(expect.arrayContaining(['grains_roots_tubers', 'nuts_seeds', 'dark_green_leafy_veg', 'meat_poultry_fish', 'other_fruits']));
    expect(r.reachedMDD).toBe(true);
  });
  it('15 g rule: a pinch of crayfish alone does not count as a group', () => {
    const r = womenFoodGroups([{ foodId: 'rice_white_boiled', grams: 250 }, { foodId: 'crayfish_dried', grams: 5 }]);
    expect(r.groups).toEqual(['grains_roots_tubers']);
  });
  it('10: 7 months, breast milk + enriched pap + pawpaw -> 5 groups, MDD reached', () => {
    const items = [...expandMeal('enriched_pap'), ...expandMeal('mashed_pawpaw')];
    const r = childFoodGroups(items, true);
    expect(r.groups).toEqual(['breast_milk', 'grains_roots_tubers', 'pulses_nuts_seeds', 'flesh_foods', 'vitamin_a_fruits_veg']);
    expect(r.reachedMDD).toBe(true);
  });
  it('condiments do not count for the child indicator', () => {
    const r = childFoodGroups([{ foodId: 'tomato_paste', grams: 5 }], false);
    expect(r.count).toBe(0);
  });
});

describe('infant feeding (cases 8 and 9)', () => {
  const base = { ageMonths: 4, breastmilk: true, solidFeeds: 0, milkFeedsNonBreast: 0, items: [] };
  it('8: breast milk and water -> not exclusive', () => {
    expect(exclusivelyBreastfed({ ...base, otherLiquids: ['water'] })).toBe(false);
  });
  it('9: breast milk and ORS -> exclusive', () => {
    expect(exclusivelyBreastfed({ ...base, otherLiquids: ['ors'] })).toBe(true);
  });
  it('minimum acceptable diet at 7 months', () => {
    const items = [...expandMeal('enriched_pap'), ...expandMeal('mashed_pawpaw')];
    const r = iycfIndicators({ ageMonths: 7, breastmilk: true, otherLiquids: [], solidFeeds: 2, milkFeedsNonBreast: 0, items });
    expect(r?.reachedMMF).toBe(true);
    expect(r?.reachedMAD).toBe(true);
  });
});

describe('growth (cases 11 and 12)', () => {
  it('weight at the WHO 2.3rd percentile gives z close to -2', () => {
    const row = GROWTH_TABLES.weightForAge.sexes.male.rows[7];
    expect(zScore('weightForAge', 'male', 7, row.p2)).toBeCloseTo(-2, 1);
    expect(zScore('weightForAge', 'male', 7, row.M)).toBeCloseTo(0, 2);
  });
  it('11: boy 7 months with low weight-for-length is flagged soon', () => {
    const row = GROWTH_TABLES.weightForLength.sexes.male.rows.find((r) => r.x === 68)!;
    const w = row.M * Math.pow(1 + row.L * row.S * -2.4, 1 / row.L);
    const r = assessGrowth('male', { measuredOn: '2026-11-07', ageMonths: 7, weightKg: w, lengthCm: 68 });
    expect(r.z.weightForLength).toBeCloseTo(-2.4, 1);
    expect(r.flags.map((f) => f.id)).toContain('growth_low');
    expect(r.flags.find((f) => f.id === 'growth_low')?.urgency).toBe('soon');
  });
  it('12: no weight gain over 5 weeks -> faltering', () => {
    const f = checkFaltering(
      { measuredOn: '2026-10-01', ageMonths: 6, weightKg: 7.4 },
      { measuredOn: '2026-11-05', ageMonths: 7.1, weightKg: 7.3 },
    );
    expect(f?.id).toBe('growth_faltering');
  });
  it('age in months uses 30.4375-day months', () => {
    expect(ageInMonths('2026-04-07', '2026-11-07')).toBeCloseTo(7.0, 1);
  });
});

describe('danger terms (case 13)', () => {
  it('detects Pidgin bleeding', () => expect(detectDangerTerms('Abeg, I dey bleed since morning')).not.toHaveLength(0));
  it('detects English signs', () => expect(detectDangerTerms('My baby has a high temperature')).not.toHaveLength(0));
  it('does not fire on normal food questions', () => expect(detectDangerTerms('Wetin I fit cook with 2000 naira today?')).toHaveLength(0));
  it('does not fire on iron questions', () => expect(detectDangerTerms('Which foods help my blood level?')).toHaveLength(0));
});

describe('data integrity (case 15)', () => {
  it('every food has a WAFCT code and every meal ingredient exists', () => {
    for (const f of FOODS) expect(f.wafctCode).toMatch(/^\d\d_\d{3}$/);
    for (const m of MEALS) for (const i of m.ingredients) expect(FOOD_BY_ID[i.foodId]).toBeDefined();
  });
  it('missing values mark totals incomplete instead of zero', () => {
    const t = nutrientTotals([{ foodId: 'yam_boiled', grams: 200 }]);
    expect(FOOD_BY_ID.yam_boiled.per100g.vitAUgRAE).toBeNull();
    expect(t.vitAUgRAE.complete).toBe(false);
    expect(t.ironMg.complete).toBe(true);
  });
  it('nutrient maths matches the table', () => {
    const t = nutrientTotals([{ foodId: 'waterleaf', grams: 50 }]);
    expect(t.ironMg.value).toBeCloseTo(FOOD_BY_ID.waterleaf.per100g.ironMg! / 2, 1);
  });
});
