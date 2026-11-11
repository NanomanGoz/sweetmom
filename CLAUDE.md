# SweetMom Nutrition Intelligence

Open-source maternal and infant (0 to 23 months) nutrition app for Nigeria, starting with a pilot in Port Harcourt, Rivers State. Built by SweetMom (CAC-registered). Clinical lead: Dr Gozie Ezeh (MBBS).

The full product and build specification is in `SWEETMOM_NUTRITION_SPEC.md`. Read it before starting any task, and follow its priorities (P0 before P1 before P2).

## Stack

- Vite + React + TypeScript, plain CSS design tokens, single-file build (vite-plugin-singlefile); PWA manifest still to add
- Local-first storage in localStorage. No personal data is stored on any server.
- Netlify Functions for AI calls only. The Anthropic API key lives in Netlify environment variables, never in client code. Model name comes from env var `ANTHROPIC_MODEL`.
- Recharts for charts
- i18n with JSON dictionaries: `en` (English) and `pcm` (Nigerian Pidgin)
- Licence: MIT for code. `data/foods.json` is CC BY-NC-SA 3.0 IGO (derived from FAO data); see `data/SOURCES.md`.

## Commands

- `npm run dev` starts the local dev server
- `npm run build` builds for production
- `npm run test` runs Vitest unit tests
- `netlify dev` runs the app with functions locally

## Folder structure

```
/src
  /app          screens and routing
  /components   shared UI
  /engine       pure TypeScript logic: nutrients, food groups, anaemia, growth, meal planning
  /db           Dexie schema and queries
  /i18n         en.json, pcm.json
/netlify/functions   identify-meal.ts, assistant.ts
/data           foods.json, meals.json, prices.csv, food-groups.json, clinics.json, who-growth/*, SOURCES.md
/scripts        parse_wafct2019.py, build_foods.py (rebuild foods.json from the FAO table)
/content        clinician-approved knowledge articles (markdown)
/config         clinical-thresholds.json, danger-signs.json
```

## Current state (read first)

The data layer and clinical engine are DONE and tested. Do not rewrite them; build the app on top of them.

- `data/foods.json`: 75 foods from FAO/INFOODS WAFCT 2019, every value traceable to a WAFCT code
- `data/meals.json`: 20 adult and 10 infant meal templates (draft gram weights)
- `data/who-growth/`: WHO LMS tables, 0 to 24 months
- `config/`: anaemia cutoffs, growth flags, IYCF rules, danger signs and terms (all DRAFT until approved)
- `src/engine/`: `clinical.ts` (pregnancy dating, anaemia, danger terms), `growth.ts` (z-scores, flags, curves), `nutrition.ts` (meal expansion, nutrient totals, MDD-W, child MDD, EBF, MMF, MAD, iron sources). Import from `src/engine`.
- `npm run test` runs 27 passing tests. Keep them passing. Add tests for any new engine logic.

The product is now SweetMom (v0.5): core promise 'No mother goes through the first year alone'. Journey stages drive Home (src/content/journey.ts); Learn library in src/content/learn.ts (also Dr SweetMom's only source); EPDS scoring in src/engine/epds.ts with licensed wording slot src/content/epds-licensed.ts; Supermoms lead Circles; WhatsApp and other contacts in src/config/contacts.ts; photos go in PHOTOS in src/components.tsx. Clinical review list: CLINICAL_REVIEW.md. Previously SweetMom First Year (v0.3): postpartum mother and baby care. Screens: Welcome/guide, Home, weekly Check-in, Baby, Circle, Dr SweetMom (chat + live voice), Me, Need help now, in `src/screens/`. Content drafts (check-in, milestones, vaccine visits, danger signs, doctor-checked notes) in `src/content/firstyear.ts`. Design: Manrope, deep plum, blush, peach, sage; tokens in `src/styles.css`. Safety words are checked by rules in `src/derive.ts` before any AI call. Help screen contacts are placeholders in `src/screens/Help.tsx` (CONTACTS). Earlier (v0.2, nutrition): redesigned from the approved 5-screen canvas: Guide, Today, Add food, Baby, Clinic and help, plus Ask) is built. Screens live in `src/screens/`, plain-language copy and tips in `src/guidance.ts`, design tokens in `src/styles.css` (Figtree, one green, red only for danger). Food pictures use `FoodImg` in `src/components.tsx`; add real photos by filling its `PHOTOS` map. Earlier note: `src/App.tsx`, `src/screens/*`, `src/components.tsx`, `src/store.tsx` (localStorage, local-first), `src/i18n.ts` (en + draft Pidgin), `src/ai.ts`, `src/content/articles.ts`. `npm run build` produces one self-contained `dist/index.html`.
Deviations from the original spec, on purpose: plain CSS tokens in `src/styles.css` instead of Tailwind; localStorage instead of Dexie (data is small); `src/ai.ts` uses the claude.ai artifact `sample` capability. For the Netlify PWA, replace `getSampler()` with calls to Netlify Functions (spec section 7) and add vite-plugin-pwa.

If you need to change engine behaviour, change config or add a function with a test. Never duplicate clinical logic inside components.

## Safety rules (never break these)

1. Never invent nutrient values. Every nutrient number must come from `data/foods.json`, which is built from a cited food composition table. Missing values stay `null` and the UI shows "not available", never a guess.
2. AI never calculates nutrients. The vision model only identifies which foods from our database are in a photo and a rough portion size. All nutrient maths happens in `/src/engine`.
3. The app never diagnoses, never prescribes and never gives medicine or supplement doses. It can ask "Did your clinic give you iron and folic acid?" and track adherence to what the clinic prescribed.
4. Clinical thresholds live only in `config/clinical-thresholds.json`. Never hardcode a cutoff in a component. Every threshold change needs the clinical lead's sign-off, recorded in the file's `approved_by` and `approved_on` fields.
5. Danger signs are checked by rules first, before any AI call. If a danger sign matches, show the urgent screen immediately and do not call the model.
6. No personal identifiers (name, phone, clinic ID) are sent to the AI functions. Send only the photo or the question plus minimal context such as stage, gestational week or baby's age in months.
7. Always label estimates as estimates. Dietary inadequacy is not a clinical deficiency, and the copy must never imply a diagnosis.
8. No advertising and no promotion of breast-milk substitutes, feeding bottles or teats (International Code of Marketing of Breast-milk Substitutes).

## Engineering conventions

- All clinical logic in `/src/engine` is pure functions with unit tests. The test cases in spec section 11 must pass.
- Keep components small. Mobile-first at 360px width. Test on a low-end Android screen size.
- Every screen works offline except photo identification and the assistant, which show a clear offline fallback (manual logging, or the knowledge articles).
- UI copy is plain, warm and short. Sentence case. No em dashes in UI copy. Every string goes through i18n.
- Commit after each working feature with a clear message.

## Ask the clinical lead before

- Changing any threshold, danger sign, referral message or knowledge article
- Adding any feature that gives advice about medicines, supplements or medical conditions
- Sending any new kind of data off the device
