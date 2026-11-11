# Data sources, licences and review status

## foods.json

**Source:** Vincent, A., Grande, F., Compaoré, E., et al. 2020. *FAO/INFOODS Food Composition Table for Western Africa (2019) User Guide & Condensed Food Composition Table.* Rome, FAO.

**Licence:** CC BY-NC-SA 3.0 IGO (attribution, non-commercial, share-alike). Our derived `foods.json` is therefore published under the same licence, with this attribution. FAO does not endorse SweetMom. Any commercial use of this data (for example inside a paid tier) needs written permission from FAO, or a separately licensed dataset.

**How it was built:**
1. `pdftotext -layout` on the official PDF, saved to `scripts/input/wafct2019.txt`
2. `python3 scripts/parse_wafct2019.py` reads the four condensed table blocks by column position into `scripts/wafct2019_raw.json` (1,028 foods). Checks run during the build: no two values assigned to the same column on any row; three merged tokens found, all confirmed as typos in the source PDF (for example "34 40" for 3,440).
3. `python3 scripts/build_foods.py` selects 75 foods for Port Harcourt and writes `data/foods.json`.

**Conventions:**
- Values per 100 g edible portion, as eaten in the stated form (boiled, stewed, raw).
- `[bracketed]` WAFCT values are lower-quality estimates. They are kept and listed in each food's `lowQuality` field.
- `tr` (trace) is stored as 0 and listed in `trace`.
- Missing values are `null`. The engine marks totals incomplete; it never treats null as zero.
- Fruits and vegetables count as vitamin A-rich when WAFCT gives at least 120 mcg RAE per 100 g (MDD-W rule).

**Needs the clinical lead's decision before the pilot:**

| Food | Issue |
|---|---|
| ugu | No *Telfairia occidentalis* entry in WAFCT 2019. Uses pumpkin leaves (04_116) as a proxy. Replace with a Nigerian ugu analysis when sourced. |
| periwinkle | No entry. Uses Venus clams (09_095) as a proxy. |
| ogi_pap | WAFCT gives 4.2 mg iron per 100 g for cooked ogi, high for maize porridge. Keep or set iron to null? |
| pawpaw | WAFCT RAE is 63 (below 120), but the MDD-W guide names ripe papaya as vitamin A-rich. Currently grouped as vitamin A-rich. |
| palm_oil_red | Counted with vitamin A-rich foods (MDD-W guidance). Confirm for the child indicator. |

Foods not in WAFCT 2019 and not yet included: scent leaf (*Ocimum gratissimum*), uziza, ponmo (cow skin), stockfish, smoked bonga fish. Add only with a cited composition source.

## meals.json

Draft recipes written for this prototype. **Gram weights are estimates** and must be reviewed by the clinical lead and a registered dietitian. Composite foods (moi moi, akara, eba) are entered as ingredient weights (dry beans, dry garri, oil) because WAFCT 2019 has no Nigerian composite entries; cooking losses are not modelled.

## who-growth/*.json

**Source:** WHO Child Growth Standards (2006), LMS parameters 0 to 24 months, from the WHO growth chart data files distributed by the US CDC (monthly ages; length in 0.5 cm steps). Values between rows are linearly interpolated. For higher precision later, switch to WHO's daily (age in days) LMS tables.

## food-groups.json

- Women: FAO 2021, *Minimum dietary diversity for women: an updated guide for measurement*. 10 groups, MDD-W at 5 or more, 15 g minimum per group per day.
- Children 6 to 23 months: WHO and UNICEF 2021, *Indicators for assessing infant and young child feeding practices*. 8 groups, MDD at 5 or more.

## clinics.json, prices.csv

Placeholders. Fill with confirmed partner clinics and real Port Harcourt market prices (with the month collected).
