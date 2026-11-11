# SweetMom clinical content: review checklist

Everything a mother reads or that changes what the app tells her is listed here. Nothing is approved yet.
Mark each item approved (name and date) in the file itself, or note changes for the developer.

| Area | File | What to check |
|---|---|---|
| Journey stages | `src/content/journey.ts` | Stage timing, struggles, risks, actions for each of the 6 stages |
| Learn library (26 guides) | `src/content/learn.ts` | Accuracy of each guide; set `approvedBy` when done. Dr SweetMom may only answer from these |
| Weekly check-in | `src/content/firstyear.ts` (CHECKIN) | 6 questions, wording, and the safety question |
| Check-in scoring | `src/derive.ts` (scoreCheckin) | Low mood flag at 3 or more of 6; sleep, support and feeding flags |
| EPDS | `src/engine/epds.ts` | Cut-offs (10 possible, 13 likely; item 10 any score = safety), schedule (2 and 6 weeks, 3, 6, 9, 12 months). Consider a Nigerian-validated cut-off |
| EPDS wording | `src/content/epds-licensed.ts` | Empty until written permission from the Royal College of Psychiatrists. Pidgin version needs proper translation and ideally validation |
| Danger signs | `src/content/firstyear.ts` (MUM_DANGER, BABY_DANGER), `config/danger-signs.json` | Lists and wording |
| Self-harm and danger words | `src/content/firstyear.ts` (SELF_HARM_TERMS), `config/danger-signs.json` (terms) | Words that open Need help now without AI |
| Vaccines | `src/content/firstyear.ts` (VACCINE_VISITS) | Match the current NPHCDA schedule |
| Milestones and play | `src/content/firstyear.ts` (MILESTONES) | Age bands and items |
| Growth flags | `config/clinical-thresholds.json` | WHO z-score cut-offs and faltering rule |
| Baby recipes and food kinds | `data/meals.json`, `data/food-groups.json` | Gram weights, ages, safety notes |
| Help screen contacts | `src/config/contacts.ts` | Real, staffed support line, clinic, WhatsApp |
