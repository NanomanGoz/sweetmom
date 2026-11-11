// Typed access to the bundled reference data and clinical config.
// All clinical numbers live in /config and /data, never in components.
import foodsJson from '../../data/foods.json';
import mealsJson from '../../data/meals.json';
import foodGroupsJson from '../../data/food-groups.json';
import thresholdsJson from '../../config/clinical-thresholds.json';
import dangerJson from '../../config/danger-signs.json';
import wfa from '../../data/who-growth/weightForAge.json';
import lfa from '../../data/who-growth/lengthForAge.json';
import wfl from '../../data/who-growth/weightForLength.json';
import hcfa from '../../data/who-growth/headCircumferenceForAge.json';

export type NutrientKey =
  | 'energyKcal' | 'proteinG' | 'fatG' | 'carbsG' | 'fibreG' | 'calciumMg' | 'ironMg'
  | 'zincMg' | 'vitAUgRAE' | 'folateUgDFE' | 'vitB12Ug' | 'vitCMg' | 'phytateMg';

export interface Food {
  id: string;
  names: { en: string; local: string };
  wafctCode: string;
  wafctName: string;
  kind: string;
  foodGroupWomen: string | null;
  foodGroupChild: string | null;
  per100g: Record<NutrientKey, number | null>;
  lowQuality: string[];
  trace: string[];
  haemIron: boolean;
  infantSafeFromMonths?: number;
  chokingRisk?: boolean;
  commonAllergen?: boolean;
  condiment?: boolean;
  proxy?: string;
  note?: string;
  reviewNote?: string;
}

export interface MealTemplate {
  id: string;
  names: { en: string; local: string };
  audience: 'adult' | 'infant';
  ingredients: { foodId: string; grams: number }[];
  portions: { small: number; medium: number; large: number };
  portionHint: string;
  reviewRequired: boolean;
  note?: string;
}

export type Sex = 'female' | 'male';
export type GrowthIndicator = 'weightForAge' | 'lengthForAge' | 'weightForLength' | 'headCircumferenceForAge';
export interface LmsRow { x: number; L: number; M: number; S: number; p2: number; p50: number; p98: number }
export interface GrowthTable { indicator: string; sexes: Record<Sex, { xUnit: string; rows: LmsRow[] }> }

export const FOODS: Food[] = (foodsJson as { foods: Food[] }).foods;
export const FOOD_BY_ID: Record<string, Food> = Object.fromEntries(FOODS.map((f) => [f.id, f]));
export const MEALS: MealTemplate[] = (mealsJson as { meals: MealTemplate[] }).meals;
export const MEAL_BY_ID: Record<string, MealTemplate> = Object.fromEntries(MEALS.map((m) => [m.id, m]));
export const FOOD_GROUPS = foodGroupsJson;
export const THRESHOLDS = thresholdsJson;
export const DANGER = dangerJson;
export const GROWTH_TABLES: Record<GrowthIndicator, GrowthTable> = {
  weightForAge: wfa as GrowthTable,
  lengthForAge: lfa as GrowthTable,
  weightForLength: wfl as GrowthTable,
  headCircumferenceForAge: hcfa as GrowthTable,
};
