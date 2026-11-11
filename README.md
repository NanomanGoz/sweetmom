# SweetMom

**No mother goes through the first year alone.**

SweetMom is an open-source companion for Nigerian mothers in the first year after birth. It cares for the mother and the baby together, because it takes a healthy mom to raise a healthy baby.

## What it does

- **Journey-led home:** six stages of the first year, what mothers commonly struggle with at each, and what to do.
- **Wellbeing:** a daily one-tap mood check, a weekly 2-minute check-in, and scoring for the Edinburgh Postnatal Depression Scale (wording added only under licence from the Royal College of Psychiatrists). A safety answer opens "Need help now" immediately.
- **Baby:** WHO growth charts, milestones, feeding (breast milk only to 6 months, then food diversity) and Nigeria's routine immunisation schedule with reminders and calendar export.
- **Circles:** local peer groups of mothers with babies the same age, led by trained Supermoms, in the app and on WhatsApp.
- **Dr SweetMom:** AI answers only from doctor-checked guides, in English or Pidgin, by text or voice, with hand-over to a real doctor.
- **Learn:** 26 short, doctor-checked guides for SweetMoms.
- **Need help now:** danger signs and self-harm support on every screen. Safety words are caught by rules before any AI is used.

Local-first: personal data stays on the phone. Works offline once installed.

## Run it

```
npm install
npm run dev        # local development
npm run test       # 36 safety and clinical-logic tests
npm run build      # one self-contained file in dist/
```

## Project map

| Path | Contents |
|---|---|
| `src/screens/` | App screens |
| `src/content/` | Journey stages, Learn guides, check-in, vaccines, milestones (clinical drafts) |
| `src/engine/` | Tested clinical logic: growth z-scores, anaemia, feeding indicators, EPDS scoring |
| `src/config/contacts.ts` | WhatsApp number and group, support line, clinic |
| `data/` | WAFCT 2019 foods, WHO growth tables, meals |
| `CLINICAL_REVIEW.md` | Everything clinicians must approve before the pilot |

## Licences

- Code: MIT
- `data/foods.json`: derived from FAO/INFOODS West African Food Composition Table (2019), CC BY-NC-SA 3.0 IGO
- WHO Child Growth Standards: World Health Organization
- EPDS: (c) 1987 The Royal College of Psychiatrists. Wording is not included in this repository.

## Clinical governance

Clinical lead: Dr Gozie Ezeh (MBBS). All clinical content is draft until approved and recorded in `CLINICAL_REVIEW.md`.
