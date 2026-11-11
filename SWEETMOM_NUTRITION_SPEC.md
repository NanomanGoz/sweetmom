# SweetMom Nutrition Intelligence: Prototype Build Spec v0.1

Status (7 Nov 2026): data layer, clinical engine and app UI v0.1 built. Remaining: PWA install manifest, Netlify Functions for AI, clinical sign-off, native Pidgin review, real clinic and price data.
Prepared for: UNICEF Femtech Ventures, second call (Pillar 1: Healthcare access for women and girls). EOI deadline 11 November 2026.
Build window: about 48 hours with Claude Code.
Licence: open source (code and data).

---

## 1. What we are building

A free, open-source mobile web app that helps mothers in Nigeria eat well during pregnancy and breastfeeding, and feed their babies well from birth to 23 months. It connects nutrition to the clinic: it tracks food-group diversity, catches low haemoglobin results and infant growth problems, and routes the mother back to her clinic with a clear, recorded referral.

Users: mothers who are pregnant, breastfeeding, or caring for a baby aged 0 to 23 months. They use the app directly on their own (often shared) Android phones. They are recruited through partner antenatal and immunisation clinics in Port Harcourt.

What makes it different:
- Built on a real West African food composition table, using Nigerian meals, Nigerian portion sizes and Port Harcourt market prices
- One profile follows mother and baby through the first 1,000 days
- Screening, referral and follow-up are part of the nutrition flow, not separate
- AI is bounded: it recognises food and explains things in plain English or Pidgin, but every number and every clinical rule is deterministic and clinician-approved
- Open source and local-first: the mother's data stays on her phone

### 1.1 The demo (what the prototype must show)

The 2 to 3 minute demo video for UNICEF follows one family. Everything in this list is P0.

1. **Set up.** Amara, 24 weeks pregnant, sets up in under 2 minutes: consent, stage, due date, her clinic, food budget, language.
2. **Log a meal.** She photographs lunch. The app suggests rice, fish and ugu soup. She confirms portion sizes with taps. Her food-group plate fills in.
3. **Catch anaemia.** She enters a haemoglobin result of 9.2 g/dL. The app classifies it using WHO cutoffs, tells her plainly to see her clinic, shows the clinic's details, and logs a referral. It asks whether her clinic gave her iron and folic acid. It never prescribes.
4. **Feed the baby.** Switch to her first child, Tobe, 7 months. Log his weight. See the WHO growth chart. Open the 6 to 8 month feeding guide with a local recipe (enriched pap). See his food-group count for today.
5. **Ask in Pidgin.** "Wetin I fit cook with 2000 naira today?" The assistant answers using the meal planner and the food database.
6. **Pilot view.** A simple dashboard showing aggregated, anonymous indicators (clearly labelled as demo data).

---

## 2. Tech stack and architecture

| Layer | Choice | Why |
|---|---|---|
| App | Vite + React + TypeScript + Tailwind, PWA | Fast to build, installable, works offline, low data use |
| Storage | IndexedDB via Dexie | Local-first, private, works on shared phones with a PIN |
| AI | Netlify Functions calling the Anthropic API | Keeps the API key server-side; nothing personal sent |
| Charts | Recharts | Growth charts and trends |
| Languages | en, pcm (Nigerian Pidgin) | Pidgin is widely understood in Port Harcourt |
| Hosting | Netlify | Free tier is enough for the pilot demo |
| Code | Public GitHub repo, Apache-2.0 | UNICEF open-source requirement |

```
 Mother's phone (PWA, offline-first)
 ┌──────────────────────────────────────────────────────┐
 │ Screens (React)                                       │
 │   Home · Log meal · My nutrition · Labs & care        │
 │   Baby · Meal planner · Ask SweetMom · Settings       │
 │                                                       │
 │ Engine (pure TypeScript, unit tested)                 │
 │   nutrients · food groups (MDD-W, child MDD)          │
 │   anaemia classifier · danger-sign rules              │
 │   WHO growth z-scores · budget meal planner           │
 │                                                       │
 │ Local data: IndexedDB (Dexie)                         │
 │ Bundled reference data: foods, meals, prices,         │
 │   WHO growth tables, thresholds, knowledge articles   │
 └───────────────┬──────────────────────────────────────┘
                 │ only photo or question + stage/age
                 ▼
 Netlify Functions ──► Anthropic API
   identify-meal      (returns food IDs from our list + portion size)
   assistant          (grounded answer, en or pcm)
```

Future (not in prototype): optional encrypted sync for the pilot, a clinic dashboard, WhatsApp reminders via the Business API, and DHIS2 / FHIR export.

---

## 3. Data model

Store in Dexie. Field names are chosen to map cleanly to FHIR resources later (Patient, Observation, Condition-free, ServiceRequest).

```ts
type Stage = 'pregnant' | 'breastfeeding' | 'caregiver';
type Lang = 'en' | 'pcm';

interface Consent {
  id: string; version: string; acceptedAt: string;
  allowAiPhoto: boolean; allowAiAssistant: boolean; allowPilotSharing: boolean;
}

interface Mother {
  id: string; displayName: string; ageYears?: number;
  stage: Stage; lang: Lang; clinicId?: string;
  dailyFoodBudgetNaira?: number;
  dietPattern: 'mixed' | 'vegetarian' | 'limited_animal';
  avoidFoods: string[];            // food IDs she does not eat
  createdAt: string;
}

interface Pregnancy {
  id: string; motherId: string;
  dueDate?: string; lmpDate?: string;   // one of the two is required
  status: 'active' | 'delivered' | 'ended';
}

interface Infant {
  id: string; motherId: string; name: string;
  sex: 'female' | 'male'; dateOfBirth: string;
  birthWeightKg?: number; preterm?: boolean;
}

interface MealLog {
  id: string; subjectType: 'mother' | 'infant'; subjectId: string;
  eatenAt: string; source: 'photo' | 'quick' | 'meal_template';
  items: MealItem[]; photoKept: boolean;
}
interface MealItem { foodId: string; grams: number; portionLabel?: string; aiSuggested: boolean; confirmed: boolean; }

interface LabResult {
  id: string; motherId: string; type: 'haemoglobin';
  value: number; unit: 'g/dL'; takenOn: string;
  trimesterAtTest?: 1 | 2 | 3; classification: AnaemiaClass;
}

interface Referral {
  id: string; subjectType: 'mother' | 'infant'; subjectId: string;
  reason: 'anaemia_mild' | 'anaemia_moderate' | 'anaemia_severe' |
          'growth_low' | 'growth_very_low' | 'growth_faltering' | 'danger_sign';
  urgency: 'routine' | 'soon' | 'today';
  createdAt: string; status: 'open' | 'attended' | 'not_attended';
  attendedOn?: string;
}

interface GrowthMeasurement { id: string; infantId: string; measuredOn: string; weightKg?: number; lengthCm?: number; }

interface FeedingLog {          // 24-hour recall, used for EBF and child MDD
  id: string; infantId: string; date: string;
  breastmilk: boolean; otherLiquids: string[]; foodGroupsEaten: string[];
}

interface SupplementAdherence { id: string; motherId: string; date: string; prescribedByClinic: boolean; takenToday: boolean; }
```

---

## 4. Reference data (/data)

### 4.1 Foods: `data/foods.json`

**Status: built.** 75 foods extracted from the FAO/INFOODS West African Food Composition Table (2019) PDF by `scripts/parse_wafct2019.py` and `scripts/build_foods.py`. Provenance, licence (CC BY-NC-SA 3.0 IGO) and the five items awaiting clinical decision are in `data/SOURCES.md`. The interface below shows the shape actually produced.

```ts
interface Food {               // see src/engine/data.ts for the exact type
  id: string;                    // e.g. "waterleaf"
  names: { en: string; local: string };
  wafctCode: string; wafctName: string;
  foodGroupWomen: string | null; foodGroupChild: string | null;
  per100g: Record<NutrientKey, number | null>;  // energy, protein, fat, carbs, fibre, calcium,
                                                 // iron, zinc, vit A RAE, folate DFE, B12, vit C, phytate
  lowQuality: string[]; trace: string[];
  haemIron: boolean;
  infantSafeFromMonths?: number; chokingRisk?: boolean; commonAllergen?: boolean;
  condiment?: boolean; proxy?: string; note?: string; reviewNote?: string;
}
```

Starter food list (about 55 items, chosen for Port Harcourt):

- **Grains, roots, tubers, plantain:** white rice (cooked), parboiled rice, maize, ogi/pap (maize), oats, bread, yam (boiled), cassava, garri, eba, fufu, sweet potato, cocoyam, unripe plantain, ripe plantain, pasta, millet
- **Pulses:** cowpea/brown beans (cooked), black-eyed beans, moi moi, akara
- **Nuts and seeds:** groundnut, groundnut paste, egusi (melon seed), sesame, cashew
- **Dairy:** milk (fluid), powdered milk, yoghurt, cheese
- **Meat, poultry, fish:** chicken, beef, goat meat, liver, dried fish, fresh fish (mackerel/titus), catfish, periwinkle, crayfish, prawns, snail
- **Eggs:** chicken egg
- **Dark green leafy vegetables:** ugu (fluted pumpkin leaves), waterleaf, bitter leaf, ewedu, scent leaf, spinach (efo/green amaranth), afang (okazi)
- **Other vitamin A-rich fruits and vegetables:** pawpaw (ripe), mango, carrot, orange-flesh sweet potato, red palm oil
- **Other vegetables:** okra, tomato, onion, garden egg, cabbage, cucumber, pepper
- **Other fruits:** orange, banana, pineapple, watermelon, guava, avocado

### 4.2 Food groups: `data/food-groups.json`

Women (MDD-W, 10 groups; minimum dietary diversity is reached at 5 or more groups in a day):
1. Grains, white roots and tubers, and plantains
2. Pulses (beans, peas, lentils)
3. Nuts and seeds
4. Dairy
5. Meat, poultry and fish
6. Eggs
7. Dark green leafy vegetables
8. Other vitamin A-rich fruits and vegetables
9. Other vegetables
10. Other fruits

Children 6 to 23 months (MDD, 8 groups; minimum reached at 5 or more):
1. Breast milk
2. Grains, roots, tubers and plantains
3. Pulses, nuts and seeds
4. Dairy products
5. Flesh foods (meat, fish, poultry, organ meats)
6. Eggs
7. Vitamin A-rich fruits and vegetables
8. Other fruits and vegetables

Red palm oil counts toward group 8 (women) only per the MDD-W guidance on red palm oil; check the guidance and record the decision in `SOURCES.md`.

### 4.3 Meals: `data/meals.json`

Composite meals that the photo AI and quick-log can map to. Each meal is a recipe in grams per standard serving, with portion labels in household terms. **The clinical lead reviews every recipe.**

```ts
interface MealTemplate {
  id: string; names: { en: string; pcm?: string };
  audience: 'adult' | 'infant_6_8' | 'infant_9_11' | 'infant_12_23';
  ingredients: { foodId: string; grams: number }[];   // medium serving
  portions: { small: number; medium: number; large: number }; // multipliers
  portionHints: { en: string; pcm?: string };          // e.g. "a wrap of eba the size of your fist"
  estCostNaira?: number;       // computed from prices.csv
}
```

Adult starter meals (about 20): jollof rice with fish; white rice and stew with chicken; beans porridge with ripe plantain; moi moi with pap; akara with pap; yam and egg sauce; boiled yam with garden egg sauce; eba with egusi and ugu soup; eba with okra soup and fish; fufu with afang soup; garri with groundnut and fish; native soup (onunu or fisherman soup) with yam; rice and beans with fish stew; bread and egg; oats with milk and banana; plantain and beans; fruit plate (pawpaw, orange, banana); periwinkle and vegetable soup with eba.

Infant starter meals (about 8): enriched pap (ogi with groundnut paste and crayfish); mashed beans and ripe plantain; mashed yam with egg; mashed sweet potato with fish; pap with milk; soft rice with fish stew (mashed); egg and plantain mash; family pot mashed (12 months and up).

### 4.4 Prices: `data/prices.csv`

`foodId, unit, unitGrams, priceNaira, market, collectedOn`

Collect real prices from Port Harcourt markets (for example Mile 1, Creek Road, Oil Mill). Label prices in the UI with the collection month. Never present them as live prices.

### 4.5 WHO growth standards: `data/who-growth/`

**Status: built.** Converted from the uploaded WHO tables (monthly, plus weight-for-length by 0.5 cm and head circumference). `src/engine/growth.ts` interpolates between rows and computes z-scores with the LMS formula:

`z = ((X / M) ^ L - 1) / (L * S)`

Use the WHO-recommended adjustment for weight-based indicators when |z| > 3. Do not type the tables from memory.

### 4.6 Clinics: `data/clinics.json`

Partner clinics for the pilot with name, address, phone, opening hours and services (ANC, immunisation, lab). Use clearly marked placeholders until partners confirm.

### 4.7 Knowledge articles: `/content/*.md`

Short, clinician-approved articles (150 to 300 words each) that the assistant can cite and that work offline. Front matter: `id, title, audience, approved_by, approved_on, sources`.

Starter set: eating well in each trimester; iron-rich foods and how to absorb more iron; anaemia in pregnancy explained; malaria and anaemia; eating well while breastfeeding; exclusive breastfeeding 0 to 6 months; common breastfeeding problems; starting solid foods at 6 months; textures and how often to feed by age; responsive feeding; food hygiene for babies; choking risks; danger signs in pregnancy; danger signs in babies; eating well on a small budget.

---

## 5. Clinical logic (`config/clinical-thresholds.json`)

**Status: built as DRAFT** in `config/clinical-thresholds.json` and `config/danger-signs.json`, implemented in `src/engine/clinical.ts` and `src/engine/growth.ts`. All values below must be checked by the clinical lead against the current WHO guideline before the demo, then marked approved in the file.

### 5.1 Haemoglobin classification (WHO 2024 guideline on haemoglobin cutoffs; verify)

| Group | Normal | Mild | Moderate | Severe |
|---|---|---|---|---|
| Pregnant, 1st trimester | ≥ 11.0 | 10.0 to 10.9 | 7.0 to 9.9 | < 7.0 |
| Pregnant, 2nd trimester | ≥ 10.5 | 9.5 to 10.4 | 7.0 to 9.4 | < 7.0 |
| Pregnant, 3rd trimester | ≥ 11.0 | 10.0 to 10.9 | 7.0 to 9.9 | < 7.0 |
| Not pregnant (incl. breastfeeding), 15+ yrs | ≥ 12.0 | 11.0 to 11.9 | 8.0 to 10.9 | < 8.0 |

Values in g/dL. Port Harcourt is near sea level, so no altitude adjustment.

Trimester is computed from the due date or LMP on the test date.

### 5.2 Actions by classification

| Class | Urgency | What the app does |
|---|---|---|
| Normal | none | Encouragement, keep eating iron-rich foods |
| Mild | routine | "Talk to your clinic about this at your next visit." Referral logged. Iron-rich food tips. |
| Moderate | soon | "Please see your clinic within [X] days." Referral logged with clinic details. Ask about iron and folic acid from clinic. |
| Severe | today | Full-screen urgent message: "Please go to the hospital today." Clinic and emergency details. Referral logged. No food tips on this screen. |

The clinical lead sets [X] and the exact wording. The app asks "Did your clinic give you iron and folic acid tablets?" If yes, it offers a daily adherence tick. It never names a dose.

### 5.3 Danger signs (rule-based, checked before any AI call)

Pregnancy: vaginal bleeding; severe headache or blurred vision; convulsions or fits; severe abdominal pain; fever; baby moving less or not moving; swelling of the face or hands; fluid leaking from the vagina; difficulty breathing.

Baby: not able to feed or breastfeed; convulsions; very sleepy or hard to wake; fast or difficult breathing; fever or very cold body; yellow skin or eyes in the first days of life or on the palms and soles; repeated vomiting; diarrhoea with blood.

Implementation: a "Something is wrong" button on Home opens a checklist. Any tick goes straight to the urgent screen. The assistant also runs a keyword check (English and Pidgin terms, maintained in `config/danger-terms.json`) before calling the model.

### 5.4 Growth flags

| Indicator | Flag | Urgency |
|---|---|---|
| Weight-for-length z < -3 | Very low weight for length | today |
| Weight-for-length z < -2 | Low weight for length | soon |
| Weight-for-age z < -2 | Low weight for age | soon |
| Length-for-age z < -2 | Short for age | routine |
| Weight-for-length z > +2 | Possible overweight | routine |
| No weight gain between two measurements at least 4 weeks apart | Growth faltering | soon |

Copy must never say "malnourished" or "stunted" to the mother. Use plain, calm language and a clear next step.

### 5.5 Dietary indicators

- Mother: count of MDD-W groups today (0 to 10); "reached" at 5 or more
- Infant under 6 months: exclusive breastfeeding yesterday (breast milk only, no other liquids or foods; prescribed medicines and ORS allowed)
- Infant 6 to 23 months: child MDD count (0 to 8); "reached" at 5 or more; meal frequency by age; minimum acceptable diet when both are met (use the WHO/UNICEF 2021 indicator definitions)

These are also the pilot outcome measures.

---

## 6. Features

Priorities: **P0** is required for the demo. **P1** if time allows. **P2** is after the EOI.

### F1. Onboarding and consent (P0)
- Language choice first (English / Pidgin)
- Plain-language consent: what is stored (on this phone only), what is sent to AI (photo or question, without name), what is never shared. Separate toggles for photo AI, assistant and pilot data sharing.
- Stage, due date or LMP, baby details if any, clinic, budget, diet pattern
- Optional 4-digit PIN for shared phones
- Done in under 2 minutes, one question per screen
- Acceptance: a user who declines AI still gets a fully working app with manual logging

### F2. Home (P0)
- Greeting, stage and week ("24 weeks pregnant") or baby's age
- **The plate:** a round plate split into 10 segments (MDD-W groups) that fill in colour as food groups are logged today. This is the signature visual. Tapping a segment shows foods from that group she could add.
- Today's to-dos: log a meal, take your clinic tablets (only if prescribed), next clinic visit
- Open referrals with a button: "I went to the clinic"
- "Something is wrong" button (always visible)
- Switch between Mother and Baby profiles

### F3. Log a meal (P0)
- **Quick log:** search or pick from meal templates and foods (with local names), choose small, medium or large with portion hints
- **Photo log:** take a photo, send it to `identify-meal`, show suggested meal template or foods with confidence, let her confirm, remove or add items, then choose portion size. Nothing is saved until she confirms.
- Photos are deleted after identification unless she chooses to keep them
- Offline: photo option shows "Photo needs internet. Log by tapping instead."
- Acceptance: nutrient totals come only from `foods.json` via the engine

### F4. My nutrition (P0)
- Today and last 7 days: food groups reached, days with 5 or more groups
- Key nutrients from food (iron, folate, protein, calcium, vitamin A) shown as amounts with a simple week-on-week trend, labelled "Estimate from the food you logged". No percentage-of-requirement bars in v1: iron needs in pregnancy cannot be met from food alone and a percentage would mislead. Use `ironSources()` for plain tips (iron foods eaten, vitamin C with meals, tea with meals).
- Plain tips tied to gaps ("You had no dark green leaves this week. Ugu or waterleaf in your soup counts.")
- Never use the word "deficiency"

### F5. Labs and care (P0)
- Enter haemoglobin and date
- Classification and action per section 5.2, referral logged automatically
- Iron and folic acid question and daily tick (only if clinic prescribed)
- Referral list with status updates
- Next clinic visit date

### F6. Something is wrong (P0)
- Danger-sign checklist per section 5.3
- Urgent screen: clear instruction, clinic phone (tap to call), nearest partner clinic, logs a danger-sign referral

### F7. Baby (P0)
- Profile and age in months
- **Growth:** add weight and length, WHO chart with her baby's points on the z-score curves, flags per section 5.4
- **Feeding (0 to 5 months):** "Yesterday, did baby have anything other than breast milk?" Daily exclusive breastfeeding streak. Breastfeeding help articles.
- **Feeding (6 to 23 months):** age-stage guide (texture, how many meals a day, how much), infant recipes from `meals.json`, today's child food-group count out of 8, meal count against the target for his age
- Choking and allergen notes on infant foods

### F8. Budget meal planner (P1)
- Input: daily budget, stage, foods she avoids
- Rule-based engine picks meal templates for 1 to 7 days that maximise food-group coverage (target 5 or more groups a day, with a dark green leafy vegetable and an iron source most days) within budget, using `prices.csv`
- Output: day plan and shopping list with estimated cost (labelled with the price month)
- The AI is used only to word the plan nicely, never to choose foods or numbers

### F9. Ask SweetMom (P1)
- Chat in English or Pidgin, text input (voice in P2)
- Flow: danger-term check (rules) → retrieve the most relevant knowledge articles and, when relevant, call the meal planner → send to `assistant` function with the system prompt in section 7.2 → show the answer with "From: [article title]" links
- Refuses medicine doses, diagnosis and anything outside nutrition, breastfeeding and feeding, and points to the clinic

### F10. Settings and data (P0)
- Change language, PIN, consent toggles
- Export my data (JSON) and Delete everything (with confirmation)

### F11. Demo mode (P0)
- "Explore with example data" loads Amara (24 weeks, Hb 9.2) and Tobe (7 months, sex male, two weight points) for the video and for reviewers
- Clearly banner-labelled "Example data"

### F12. Pilot dashboard (P1)
- A separate route `/pilot` showing aggregated indicators from demo data only: enrolled, active this week, mothers reaching MDD-W, Hb results logged and referrals completed, EBF rate under 6 months, child MDD rate 6 to 23 months
- Labelled "Demo data. In the pilot this view uses anonymous, consented data only."

### F13. Reminders (P2)
- In-app reminders in the prototype. WhatsApp reminders via the Business API after the EOI.

---

## 7. AI functions

### 7.1 `netlify/functions/identify-meal.ts`

Input: image (resized client-side to max 1024px, JPEG), stage, audience (adult or infant), language.
The function sends the image plus the list of meal template IDs and food IDs with names, and asks the model to return JSON only:

```json
{
  "mealTemplateId": "eba_egusi_ugu" ,
  "items": [
    { "foodId": "eba", "confidence": 0.82, "portion": "medium" },
    { "foodId": "egusi_soup", "confidence": 0.7, "portion": "medium" }
  ],
  "notInDatabase": ["something that looks like ponmo"],
  "notFood": false
}
```

Rules in the prompt: choose only from the provided IDs; use `null` for mealTemplateId if unsure; list anything unrecognised in `notInDatabase`; no nutrient values; no comments outside JSON. Validate the JSON in the function and return a clean error if invalid. Timeout fallback to manual logging.

### 7.2 `netlify/functions/assistant.ts`

Draft system prompt (the clinical lead approves the final text):

```
You are SweetMom, a friendly nutrition helper for mothers in Nigeria.
You help with: eating well in pregnancy and while breastfeeding, feeding babies
from birth to 2 years, affordable Nigerian meals, and understanding food groups.

Use ONLY the reference articles and meal plan data given to you below. If the
answer is not in them, say you are not sure and suggest asking at the clinic.

Never: diagnose, interpret symptoms, name or dose any medicine or supplement,
advise stopping a treatment, or comment on things outside food and feeding.
If the mother mentions any worrying symptom, tell her to contact her clinic or
go to the hospital now, and stop.

Reply in {language}. If Pidgin, use simple, natural Nigerian Pidgin.
Keep answers under 120 words, warm and practical. Use Nigerian foods and prices
from the data given. Mention which article you used by its title.

Mother's context: stage={stage}, week={week}, baby_age_months={age}.
Reference articles: {articles}
Meal plan data (if any): {plan}
```

Log nothing personal. In the pilot, with consent, store the question, answer and article IDs locally for the clinical lead's review.

---

## 8. Design direction

Audience: mothers in Port Harcourt, many with basic smartphones, some with limited reading confidence, often sharing a phone. The job: make good food choices feel doable today, and make the clinic step unmissable.

| Token | Value | Use |
|---|---|---|
| Ugu green | #2F6B47 | Primary actions, filled plate segments |
| Leaf light | #E4F0E6 | Surfaces, selected states |
| Pawpaw | #E98A3B | Highlights, baby profile accents |
| Ink | #1E2A24 | Text |
| Mist | #F6F8F5 | Background |
| Alert red | #B83227 | Urgent screens and danger button only |

- **Type:** Atkinson Hyperlegible for everything. It was designed for readers with low vision and it keeps numbers and similar letters distinct, which matters for haemoglobin values and portion choices. One family, three weights, large base size (17px), generous line height.
- **Signature:** the food-group plate on Home. Each segment has a simple food illustration (yam, beans, groundnut, milk, fish, egg, ugu, pawpaw, okra, orange), so it reads without text. Spend the visual boldness here and keep everything else calm.
- **Photos and icons:** Nigerian food, drawn simply. No stock photos of Western meals.
- **Interaction:** one question per screen in onboarding, big tap targets (48px minimum), icons always paired with words.
- **Urgent screens** break the calm deliberately: full red, one instruction, one call button.
- **Copy:** plain verbs, sentence case, second person. "Log lunch", not "Submit". Errors say what happened and what to do. Pidgin strings written by a native speaker, not machine translated, before the pilot.

---

## 9. Privacy and safety by design

This section maps directly to UNICEF's safety-by-design condition and should be quoted in the EOI.

- **Local-first:** all personal data lives on the phone in IndexedDB. No accounts, no server database in the prototype.
- **Minimum data to AI:** photos and questions only, with stage and age. No names, phone numbers or clinic IDs. Photos are not kept by default.
- **Consent architecture:** granular, revocable toggles; the app works fully with AI switched off.
- **Shared-phone protection:** optional PIN, discreet app name and icon option, quick exit.
- **Clinical governance:** every threshold, article and recipe has a named approver and date. AI never sets numbers or rules.
- **Deterministic safety rails:** danger signs and red-flag results are handled by rules before any AI call.
- **Rights:** export and delete at any time.
- **Law and codes:** Nigeria Data Protection Act 2023; International Code of Marketing of Breast-milk Substitutes; no ads.
- **Open source:** code and data published so ministries, NGOs and other countries can audit, reuse and adapt it.

---

## 10. 48-hour build plan with Claude Code

Start each session by telling Claude Code: "Read CLAUDE.md and SWEETMOM_NUTRITION_SPEC.md first."

**Session 1 (about 3 hours): foundation**
> This folder already contains the tested engine (src/engine), data and config. Do not modify them. Add a Vite + React + TypeScript + Tailwind PWA around them (keep the existing package.json scripts and tsconfig settings, merge as needed), with Dexie, i18n (en, pcm), routing for all screens in section 6, the design tokens in section 8, and Atkinson Hyperlegible. Create the Dexie schema from section 3. Confirm `npm run test` still passes. Deploy the shell to Netlify.

**Session 2: DONE.** Data layer and engine delivered with 27 passing tests. Skip to session 3. If you have time, ask Claude Code to add the budget meal planner (F8) to `src/engine` with tests once `prices.csv` is filled.

**Session 3 (about 4 hours): mother flows**
> Build F1 onboarding and consent, F2 Home with the food-group plate, F3 quick log, F4 My nutrition, F5 Labs and care, F6 Something is wrong, F10 Settings, F11 demo mode with Amara.

**Session 4 (about 4 hours): baby and AI**
> Build F7 Baby (growth chart, feeding 0 to 5 and 6 to 23 months) with Tobe in demo mode. Build the identify-meal function and F3 photo logging. Then F9 assistant with the knowledge articles in /content.

**Session 5 (about 3 hours): polish and ship**
> F8 meal planner and F12 pilot dashboard if time allows. Test on a 360px screen, offline mode, Pidgin. Fix issues. Write README (what it is, how to run, licences, data sources, clinical governance). Publish the GitHub repo and redeploy.

**Your work in parallel (not Claude Code):**
- Day 1: download WAFCT 2019 and the WHO growth LMS tables; collect prices for the starter foods (one market visit or phone calls)
- Day 2: review meal gram weights, thresholds and the danger-sign wording; approve the starter knowledge articles
- Day 3: get a native Pidgin speaker to check the Pidgin strings for the demo screens
- Day 4: record the demo video, finish the EOI

**Cut lines if time runs short:** drop F12, then F8, then the assistant (F9). Never cut consent, the anaemia pathway, danger signs, growth or the plate.

---

## 11. Test cases (must pass before demo)

| # | Input | Expected |
|---|---|---|
| 1 | Pregnant, 24 weeks, Hb 9.2 | 2nd trimester, moderate, urgency soon, referral created |
| 2 | Pregnant, 10 weeks, Hb 10.5 | 1st trimester, mild, routine |
| 3 | Pregnant, 20 weeks, Hb 10.6 | 2nd trimester, normal |
| 4 | Pregnant, 32 weeks, Hb 6.8 | severe, urgent screen, no food tips shown |
| 5 | Breastfeeding, Hb 11.5 | not pregnant, mild |
| 6 | Breastfeeding, Hb 7.9 | not pregnant, severe |
| 7 | Mother logs eba with egusi and ugu soup (with meat), plus an orange | grains, nuts/seeds, dark green leafy, meat/fish, other fruits (plus vitamin A group from 15 g palm oil), MDD-W reached |
| 8 | Infant 4 months, yesterday breast milk and water | not exclusively breastfed |
| 9 | Infant 4 months, breast milk and ORS | exclusively breastfed |
| 10 | Infant 7 months: breast milk, enriched pap (ogi, groundnut, crayfish), mashed pawpaw | child groups: breast milk, grains, pulses/nuts, flesh, vitamin A fruit = 5, MDD reached |
| 11 | Boy 7 months, 68 cm, weight giving z = -2.4 for WFL | low weight for length, soon |
| 12 | Two weights 5 weeks apart, second lower | growth faltering, soon |
| 13 | Assistant question contains "I dey bleed" | danger rule fires, no model call, urgent screen |
| 14 | Assistant asked "How many iron tablets should I take?" | declines dose, points to clinic |
| 15 | Food with null iron value logged | iron total marked incomplete, never treated as zero |
| 16 | Consent: photo AI off | photo button hidden, quick log works |
| 17 | Airplane mode | all screens except photo and assistant work |

Clinical lead confirms cases 1 to 6 and 11 against the WHO tables before relying on them.

---

## 12. Out of scope for the prototype

Accounts and server sync; clinic-facing dashboard with real patient data; WhatsApp Business API; voice input; Igbo, Ikwerre, Ijaw, Yoruba or Hausa; preconception module; children over 23 months; any medicine, supplement or therapeutic diet advice; payments; marketplace.

---

## 13. Pilot design (for the EOI and later RFP)

- **Where:** 3 partner clinics in Port Harcourt (antenatal and immunisation)
- **Who:** 300 mothers: 200 pregnant (enrolled before 28 weeks) and 100 with babies aged 0 to 23 months
- **How long:** 6 months
- **Primary indicators:** proportion of mothers reaching MDD-W; haemoglobin results logged and moderate or severe results with a completed clinic follow-up; exclusive breastfeeding under 6 months; child MDD and minimum acceptable diet at 6 to 23 months
- **Product indicators:** activation, weekly active use, retention to delivery and to 3 months postpartum, referral completion rate
- **Method:** baseline and endline 24-hour recall interviews by clinic staff (not app data alone), compared with app-logged data
- **Why Rivers:** stunting in Rivers is lower than the national average, so the pilot focuses on maternal anaemia, diet diversity and infant feeding practices, which remain high-burden, then scales to higher-burden states with the validated model
- **Honest limits:** a 6-month pilot tests feasibility, use and feeding behaviour. It does not claim reductions in anaemia prevalence, stunting or mortality.

---

## 14. Sources to cite

- FAO/INFOODS West African Food Composition Table (2019)
- WHO guideline on haemoglobin cutoffs to define anaemia (2024)
- WHO Child Growth Standards (2006) and WHO Anthro z-score methods
- FAO Minimum Dietary Diversity for Women (MDD-W) guide
- WHO/UNICEF Indicators for assessing infant and young child feeding practices (2021)
- WHO guideline for complementary feeding of infants and young children 6 to 23 months (2023)
- WHO recommendations on antenatal care for a positive pregnancy experience (2016)
- Nigeria Demographic and Health Survey 2024
- Nigeria Data Protection Act 2023
- International Code of Marketing of Breast-milk Substitutes
