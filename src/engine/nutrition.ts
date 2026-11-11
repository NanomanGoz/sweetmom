// Nutrient totals, food-group diversity (MDD-W, child MDD) and infant feeding indicators.
// Every number comes from data/foods.json. The AI never computes nutrients.
import { FOOD_BY_ID, MEAL_BY_ID, FOOD_GROUPS, THRESHOLDS, type NutrientKey } from './data';

export interface Item { foodId: string; grams: number }
export type Portion = 'small' | 'medium' | 'large';

/** Turn a meal template + portion into food items. */
export function expandMeal(mealId: string, portion: Portion = 'medium'): Item[] {
  const meal = MEAL_BY_ID[mealId];
  if (!meal) throw new Error(`unknown meal ${mealId}`);
  const k = meal.portions[portion];
  return meal.ingredients.map((i) => ({ foodId: i.foodId, grams: Math.round(i.grams * k * 10) / 10 }));
}

export interface NutrientTotal { value: number; complete: boolean; lowQuality: boolean }

/** Sum nutrients. A nutrient is marked incomplete when any eaten food has no value for it (never treated as zero). */
export function nutrientTotals(items: Item[]): Record<NutrientKey, NutrientTotal> {
  const out = {} as Record<NutrientKey, NutrientTotal>;
  for (const it of items) {
    const f = FOOD_BY_ID[it.foodId];
    if (!f) throw new Error(`unknown food ${it.foodId}`);
    for (const k of Object.keys(f.per100g) as NutrientKey[]) {
      const cur = (out[k] ??= { value: 0, complete: true, lowQuality: false });
      const v = f.per100g[k];
      if (v == null) cur.complete = false;
      else cur.value += (v * it.grams) / 100;
      if (f.lowQuality.includes(k)) cur.lowQuality = true;
    }
  }
  for (const k of Object.keys(out) as NutrientKey[]) out[k].value = Math.round(out[k].value * 10) / 10;
  return out;
}

const merge = (items: Item[]) => {
  const g: Record<string, number> = {};
  for (const i of items) g[i.foodId] = (g[i.foodId] ?? 0) + i.grams;
  return g;
};

/**
 * MDD-W: food groups eaten across a whole day (pass all of the day's items).
 * A group counts only when at least 15 g of foods in that group were eaten that day.
 */
export function womenFoodGroups(dayItems: Item[]) {
  const min = FOOD_GROUPS.women.minGramsPerGroupPerDay;
  const grams: Record<string, number> = {};
  for (const [foodId, g] of Object.entries(merge(dayItems))) {
    const grp = FOOD_BY_ID[foodId]?.foodGroupWomen;
    if (grp) grams[grp] = (grams[grp] ?? 0) + g;
  }
  const groups = FOOD_GROUPS.women.groups.map((x) => x.id).filter((id) => (grams[id] ?? 0) >= min);
  return { groups, count: groups.length, reachedMDD: groups.length >= FOOD_GROUPS.women.minGroupsForMDD, gramsByGroup: grams };
}

/**
 * Child MDD (6-23 months): 8 groups, breast milk is one. Any amount counts, except foods flagged as condiments.
 */
export function childFoodGroups(dayItems: Item[], hadBreastmilk: boolean) {
  const set = new Set<string>();
  if (hadBreastmilk) set.add('breast_milk');
  for (const i of dayItems) {
    const f = FOOD_BY_ID[i.foodId];
    if (!f || f.condiment || !f.foodGroupChild || i.grams <= 0) continue;
    set.add(f.foodGroupChild);
  }
  const groups = FOOD_GROUPS.child.groups.map((x) => x.id).filter((id) => set.has(id));
  return { groups, count: groups.length, reachedMDD: groups.length >= FOOD_GROUPS.child.minGroupsForMDD };
}

export interface InfantDayRecall {
  ageMonths: number;
  breastmilk: boolean;
  otherLiquids: string[];      // e.g. 'water', 'formula', 'ors', 'drops_syrups_medicines'
  solidFeeds: number;          // number of times solid, semi-solid or soft food was eaten
  milkFeedsNonBreast: number;  // formula / animal milk feeds (for non-breastfed children)
  items: Item[];
}

/** Exclusive breastfeeding (under 6 months): breast milk only; ORS and medicines allowed. */
export function exclusivelyBreastfed(r: InfantDayRecall): boolean | null {
  if (r.ageMonths >= 6) return null;
  const allowed = new Set(THRESHOLDS.iycf.ebfAllowedNonBreastmilk);
  return r.breastmilk && r.solidFeeds === 0 && r.items.length === 0 && r.otherLiquids.every((l) => allowed.has(l));
}

/** Minimum meal frequency and minimum acceptable diet (6-23 months). */
export function iycfIndicators(r: InfantDayRecall) {
  if (r.ageMonths < 6 || r.ageMonths >= 24) return null;
  const mmf = THRESHOLDS.iycf.minMealFrequency;
  const mdd = childFoodGroups(r.items, r.breastmilk);
  let reachedMMF: boolean;
  let targetFeeds: number;
  if (r.breastmilk) {
    targetFeeds = r.ageMonths < 9 ? mmf.breastfed_6_8 : mmf.breastfed_9_23;
    reachedMMF = r.solidFeeds >= targetFeeds;
  } else {
    targetFeeds = mmf.nonBreastfed_6_23_feeds;
    reachedMMF = r.solidFeeds + r.milkFeedsNonBreast >= targetFeeds && r.solidFeeds >= mmf.nonBreastfed_min_solid_feeds;
  }
  // MAD for non-breastfed children also needs at least 2 milk feeds (WHO/UNICEF 2021).
  const milkOk = r.breastmilk || r.milkFeedsNonBreast >= 2;
  return { mdd, targetFeeds, reachedMMF, reachedMAD: mdd.reachedMDD && reachedMMF && milkOk };
}

/** Iron-source summary used for plain-language tips (no requirement percentages). */
export function ironSources(dayItems: Item[]) {
  const haem = dayItems.filter((i) => FOOD_BY_ID[i.foodId]?.haemIron && i.grams >= 15).map((i) => i.foodId);
  const vitC = dayItems.filter((i) => (FOOD_BY_ID[i.foodId]?.per100g.vitCMg ?? 0) >= 20 && i.grams >= 50).map((i) => i.foodId);
  const tea = dayItems.some((i) => i.foodId === 'tea');
  return { haemIronFoods: [...new Set(haem)], vitaminCFoods: [...new Set(vitC)], hadTea: tea };
}
