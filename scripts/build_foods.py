"""
Build data/foods.json from the parsed FAO/INFOODS West African Food Composition Table 2019.

Inputs:  scripts/wafct2019_raw.json  (made by scripts/parse_wafct2019.py from the official PDF)
Output:  data/foods.json

Rules:
- Every nutrient value comes from WAFCT 2019 under the code given. Nothing is estimated.
- Values printed in [brackets] in WAFCT are lower-quality estimates; they are kept but listed in `lowQuality`.
- 'tr' (trace) is stored as 0 and listed in `trace`.
- Missing values stay null.
- Fruit and vegetable food groups follow the MDD-W rule: vitamin A-rich if >= 120 mcg RAE per 100 g.
- Any food marked `proxy` uses the composition of a related food because WAFCT has no entry.
  Proxies must be approved by the clinical lead before the pilot.

Run: python3 scripts/build_foods.py
"""
import json, re

RAW = json.load(open('scripts/wafct2019_raw.json', encoding='utf8'))

# kind: grain | pulse | nut | dairy | breastmilk | flesh | egg | dglv | veg | fruit | oil | redpalm | sugar | drink
# (id, WAFCT code, English name, local/Pidgin name, kind, extra flags)
FOODS = [
    # Grains, roots, tubers, plantain
    ('rice_white_boiled', '01_038', 'White rice, boiled', 'Rice', 'grain', {}),
    ('ogi_pap', '01_100', 'Pap (ogi), fermented maize, cooked', 'Pap / akamu / ogi', 'grain', {'infantSafeFromMonths': 6, 'reviewNote': 'WAFCT 2019 gives 4.2 mg iron per 100 g for cooked ogi, which is high for a maize porridge (possibly iron from processing equipment). Clinical lead to decide whether to keep or set iron to null.'}),
    ('oats_porridge', '01_133', 'Oats porridge', 'Oats', 'grain', {'infantSafeFromMonths': 6}),
    ('bread_white', '01_046', 'White bread', 'Bread', 'grain', {}),
    ('pasta_boiled', '01_053', 'Spaghetti or macaroni, boiled', 'Spaghetti', 'grain', {}),
    ('noodles_boiled', '01_103', 'Instant noodles, boiled', 'Indomie', 'grain', {}),
    ('yam_boiled', '02_035', 'Yam, boiled', 'Yam', 'grain', {'infantSafeFromMonths': 6}),
    ('yam_fried', '02_082', 'Yam, fried', 'Fried yam', 'grain', {}),
    ('gari_dry', '02_039', 'Garri (dry weight, also for eba)', 'Garri', 'grain', {}),
    ('fufu_wet', '02_041', 'Fufu (wet, fermented cassava)', 'Fufu / akpu', 'grain', {}),
    ('cocoyam_boiled', '02_006', 'Cocoyam, boiled', 'Cocoyam', 'grain', {}),
    ('potato_boiled', '02_010', 'Irish potato, boiled', 'Irish potato', 'grain', {'infantSafeFromMonths': 6}),
    ('sweet_potato_pale_boiled', '02_023', 'Sweet potato (white or pale), boiled', 'Sweet potato', 'grain', {'infantSafeFromMonths': 6}),
    ('sweet_potato_orange_boiled', '02_072', 'Sweet potato (orange flesh), boiled', 'Orange sweet potato', 'veg', {'infantSafeFromMonths': 6}),
    ('plantain_ripe_boiled', '02_057', 'Ripe plantain, boiled', 'Ripe plantain', 'grain', {'infantSafeFromMonths': 6}),
    ('plantain_unripe_boiled', '02_064', 'Unripe plantain, boiled', 'Unripe plantain', 'grain', {}),
    ('plantain_fried', '02_084', 'Fried plantain', 'Dodo', 'grain', {}),
    # Pulses
    ('cowpea_boiled', '03_007', 'Beans (cowpea), boiled', 'Beans', 'pulse', {'infantSafeFromMonths': 6}),
    ('cowpea_dry', '03_004', 'Beans (cowpea), dry, for moi moi and akara', 'Beans (dry)', 'pulse', {}),
    ('soya_boiled', '03_034', 'Soya beans, boiled', 'Soya beans', 'pulse', {}),
    # Nuts and seeds
    ('groundnut', '06_010', 'Groundnut', 'Groundnut', 'nut', {'chokingRisk': True, 'commonAllergen': True}),
    ('groundnut_paste', '06_026', 'Groundnut paste', 'Groundnut paste', 'nut', {'infantSafeFromMonths': 6, 'commonAllergen': True}),
    ('egusi', '06_035', 'Egusi (melon seed)', 'Egusi', 'nut', {}),
    ('sesame', '06_015', 'Sesame seed', 'Beniseed', 'nut', {}),
    ('cashew', '06_001', 'Cashew nut', 'Cashew', 'nut', {'chokingRisk': True, 'commonAllergen': True}),
    # Dairy
    ('milk_whole', '10_001', 'Milk, whole (liquid)', 'Milk', 'dairy', {'infantSafeFromMonths': 12}),
    ('milk_powder', '10_002', 'Milk powder, whole', 'Powdered milk', 'dairy', {}),
    ('milk_evaporated', '10_016', 'Evaporated milk (tinned)', 'Peak / tin milk', 'dairy', {}),
    ('yoghurt', '10_005', 'Yoghurt, plain', 'Yoghurt', 'dairy', {'infantSafeFromMonths': 6}),
    ('breastmilk', '10_004', 'Breast milk', 'Breast milk', 'breastmilk', {}),
    # Flesh foods
    ('chicken_stewed', '07_102', 'Chicken, stewed', 'Chicken', 'flesh', {'haemIron': True}),
    ('beef_stewed', '07_085', 'Beef, stewed', 'Meat', 'flesh', {'haemIron': True}),
    ('goat_stewed', '07_112', 'Goat meat, stewed', 'Goat meat', 'flesh', {'haemIron': True}),
    ('beef_liver_stewed', '07_089', 'Beef liver, stewed', 'Liver', 'flesh', {'haemIron': True, 'infantSafeFromMonths': 6}),
    ('chicken_liver_stewed', '07_042', 'Chicken liver, stewed', 'Chicken liver', 'flesh', {'haemIron': True, 'infantSafeFromMonths': 6}),
    ('tripe_boiled', '07_022', 'Beef tripe, boiled', 'Shaki', 'flesh', {'haemIron': True}),
    ('snail_cooked', '07_084', 'Snail, cooked', 'Snail / congo meat', 'flesh', {'haemIron': True}),
    ('mackerel_cooked', '09_069', 'Mackerel, cooked in soup or stew', 'Titus / mackerel', 'flesh', {'haemIron': True, 'infantSafeFromMonths': 6, 'note': 'Remove all bones for babies'}),
    ('catfish_steamed', '09_019', 'Catfish, cooked', 'Catfish', 'flesh', {'haemIron': True, 'infantSafeFromMonths': 6}),
    ('tilapia_grilled', '09_043', 'Tilapia, grilled', 'Tilapia', 'flesh', {'haemIron': True}),
    ('sardine_canned', '09_037', 'Sardine, tinned in oil', 'Sardine', 'flesh', {'haemIron': True}),
    ('crayfish_dried', '09_057', 'Crayfish, dried, ground', 'Crayfish', 'flesh', {'haemIron': True, 'infantSafeFromMonths': 6, 'note': 'Grind finely for babies'}),
    ('shrimp_boiled', '09_104', 'Shrimp, boiled', 'Shrimp', 'flesh', {'haemIron': True, 'commonAllergen': True}),
    ('periwinkle', '09_095', 'Periwinkle (proxy: venus clams)', 'Periwinkle', 'flesh', {'haemIron': True, 'proxy': 'WAFCT 2019 has no periwinkle entry. Uses Venus clams, boiled, as the closest shellfish. Needs clinical lead approval.'}),
    # Eggs
    ('egg_boiled', '08_002', 'Egg, boiled', 'Boiled egg', 'egg', {'infantSafeFromMonths': 6, 'commonAllergen': True, 'note': 'Cook well for babies'}),
    ('egg_fried', '08_003', 'Egg, fried', 'Fried egg', 'egg', {'commonAllergen': True}),
    # Dark green leafy vegetables
    ('ugu', '04_116', 'Ugu (fluted pumpkin leaves) (proxy: pumpkin leaves)', 'Ugu', 'dglv', {'proxy': 'WAFCT 2019 has no Telfairia occidentalis entry. Uses pumpkin leaves, boiled as part of a recipe. Needs clinical lead approval; replace with a Nigerian ugu analysis when sourced.'}),
    ('waterleaf', '04_120', 'Waterleaf', 'Waterleaf', 'dglv', {}),
    ('bitterleaf', '04_126', 'Bitter leaf', 'Bitterleaf / onugbu', 'dglv', {}),
    ('ewedu', '04_107', 'Ewedu (jute leaves)', 'Ewedu', 'dglv', {}),
    ('afang', '04_130', 'Afang / okazi leaves', 'Afang', 'dglv', {}),
    ('green_amaranth', '04_086', 'Green (amaranth leaves, efo tete)', 'Green / efo', 'dglv', {}),
    ('spinach', '04_118', 'Spinach', 'Spinach', 'dglv', {}),
    # Other vegetables and fruits (vitamin A grouping computed from RAE)
    ('okra', '04_111', 'Okra', 'Okro', 'veg', {}),
    ('tomato', '04_021', 'Tomato, fresh', 'Tomato', 'veg', {}),
    ('tomato_paste', '04_066', 'Tomato paste', 'Tin tomato', 'veg', {'condiment': True}),
    ('onion', '04_018', 'Onion', 'Onion', 'veg', {'condiment': True}),
    ('garden_egg', '04_074', 'Garden egg', 'Garden egg', 'veg', {}),
    ('cabbage', '04_005', 'Cabbage', 'Cabbage', 'veg', {}),
    ('cucumber', '04_032', 'Cucumber', 'Cucumber', 'veg', {}),
    ('carrot', '04_006', 'Carrot', 'Carrot', 'veg', {'infantSafeFromMonths': 6, 'chokingRisk': True, 'note': 'Cook soft and mash for babies'}),
    ('pepper_chilli', '04_046', 'Pepper (chilli)', 'Pepper', 'veg', {'condiment': True}),
    ('pepper_sweet_red', '04_047', 'Tatashe (red sweet pepper)', 'Tatashe', 'veg', {}),
    ('pawpaw', '05_017', 'Pawpaw', 'Pawpaw', 'fruit', {'infantSafeFromMonths': 6, 'groupOverride': 'vitamin_a', 'reviewNote': 'WAFCT 2019 RAE is 63 mcg/100 g (below the 120 cut-off) but the MDD-W guide lists ripe papaya as a vitamin A-rich fruit. Grouped as vitamin A-rich pending clinical lead decision.'}),
    ('mango', '05_015', 'Mango', 'Mango', 'fruit', {'infantSafeFromMonths': 6}),
    ('orange', '05_016', 'Orange', 'Orange', 'fruit', {}),
    ('banana', '05_028', 'Banana', 'Banana', 'fruit', {'infantSafeFromMonths': 6}),
    ('pineapple', '05_018', 'Pineapple', 'Pineapple', 'fruit', {}),
    ('watermelon', '05_022', 'Watermelon', 'Watermelon', 'fruit', {}),
    ('guava', '05_010', 'Guava', 'Guava', 'fruit', {}),
    ('avocado', '05_002', 'Avocado', 'Pear / avocado', 'fruit', {'infantSafeFromMonths': 6}),
    # Fats, sugar, drinks
    ('palm_oil_red', '11_004', 'Red palm oil', 'Palm oil', 'redpalm', {}),
    ('groundnut_oil', '11_003', 'Vegetable / groundnut oil', 'Groundnut oil', 'oil', {}),
    ('sugar', '13_002', 'Sugar', 'Sugar', 'sugar', {}),
    ('tea', '12_008', 'Tea', 'Tea', 'drink', {'note': 'Tea with meals reduces iron absorption'}),
]

NUTRIENTS = {
    'energyKcal': 'ENERC(kJ(kcal))', 'proteinG': 'PROTCNT(g)', 'fatG': 'FAT(g)', 'carbsG': 'CHOAVLDF(g)', 'fibreG': 'FIBTG(g)',
    'calciumMg': 'CA(mg)', 'ironMg': 'FE(mg)', 'zincMg': 'ZN(mg)', 'vitAUgRAE': 'VITA_RAE(mcg)', 'folateUgDFE': 'FOLDFE(mcg)',
    'vitB12Ug': 'VITB12(mcg)', 'vitCMg': 'VITC(mg)', 'phytateMg': 'PHYTCPP(mg)',
}

def parse_val(s, key):
    if s is None:
        return None, False, False
    low = '[' in s
    if s == 'tr':
        return 0.0, low, True
    s2 = s.replace('[', '').replace(']', '')
    if key == 'energyKcal':
        m = re.search(r'\((\d+(?:\.\d+)?)\)', s2)
        return (float(m.group(1)) if m else None), low, False
    try:
        return float(s2), low, False
    except ValueError:
        return None, low, False

WOMEN = {'grain': 'grains_roots_tubers', 'pulse': 'pulses', 'nut': 'nuts_seeds', 'dairy': 'dairy',
         'flesh': 'meat_poultry_fish', 'egg': 'eggs', 'dglv': 'dark_green_leafy_veg'}
CHILD = {'grain': 'grains_roots_tubers', 'pulse': 'pulses_nuts_seeds', 'nut': 'pulses_nuts_seeds', 'dairy': 'dairy',
         'breastmilk': 'breast_milk', 'flesh': 'flesh_foods', 'egg': 'eggs', 'dglv': 'vitamin_a_fruits_veg'}

out, problems = [], []
for fid, code, en, local, kind, extra in FOODS:
    r = RAW.get(code)
    if not r:
        problems.append(f'{fid}: code {code} not found'); continue
    per100, lowq, trace = {}, [], []
    for k, tag in NUTRIENTS.items():
        v, low, tr = parse_val(r['raw'].get(tag), k)
        per100[k] = v
        if low: lowq.append(k)
        if tr: trace.append(k)
    rae = per100['vitAUgRAE'] or 0
    vita_rich = rae >= 120
    if extra.get('groupOverride') == 'vitamin_a':
        vita_rich = True
    if kind in ('veg', 'fruit'):
        gw = 'other_vitamin_a_fruits_veg' if vita_rich else ('other_vegetables' if kind == 'veg' else 'other_fruits')
        gc = 'vitamin_a_fruits_veg' if vita_rich else 'other_fruits_veg'
    elif kind == 'redpalm':
        gw, gc = 'other_vitamin_a_fruits_veg', 'vitamin_a_fruits_veg'
        extra = dict(extra, reviewNote='Red palm oil counted with vitamin A-rich foods per MDD-W guidance. Confirm for the child indicator.')
    else:
        gw, gc = WOMEN.get(kind), CHILD.get(kind)
    food = {
        'id': fid, 'names': {'en': en, 'local': local}, 'wafctCode': code, 'wafctName': r.get('name'),
        'kind': kind, 'foodGroupWomen': gw, 'foodGroupChild': gc,
        'per100g': per100, 'lowQuality': lowq, 'trace': trace,
        'haemIron': bool(extra.get('haemIron', False)),
    }
    for k in ('infantSafeFromMonths', 'chokingRisk', 'commonAllergen', 'condiment', 'proxy', 'note', 'reviewNote'):
        if k in extra: food[k] = extra[k]
    out.append(food)

json.dump({'source': 'FAO/INFOODS Food Composition Table for Western Africa (2019). Values per 100 g edible portion.',
           'version': '0.1', 'reviewStatus': 'pending clinical lead review', 'foods': out},
          open('data/foods.json', 'w', encoding='utf8'), indent=1, ensure_ascii=False)
print(len(out), 'foods written')
for p in problems: print('PROBLEM', p)
