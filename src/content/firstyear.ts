// SweetMom First Year content. ALL CLINICAL CONTENT HERE IS DRAFT and must be approved by the clinical lead
// and a mental health professional before the pilot. Sources to check against: WHO postnatal care recommendations (2022),
// WHO/UNICEF IYCF guidance, Nigeria national immunisation schedule (NPHCDA), CDC developmental milestones (2022),
// PHQ-2 (public domain) for the two mood items.

type L = { en: string; pcm: string };

/** Weekly check-in. Mood items score 0 to 3. The self-harm item is a safety gate, not a score. */
export const CHECKIN: { id: string; about: 'mum' | 'baby'; q: L; answers: L[]; kind: 'mood' | 'safety' | 'sleep' | 'support' | 'baby' }[] = [
  { id: 'interest', about: 'mum', kind: 'mood', q: { en: 'This past week, how often have you had little interest or pleasure in doing things?', pcm: 'This week, how often you no dey enjoy anything wey you dey do?' }, answers: [{ en: 'Not at all', pcm: 'At all' }, { en: 'Some days', pcm: 'Some days' }, { en: 'More than half the days', pcm: 'Pass half of the days' }, { en: 'Nearly every day', pcm: 'Almost every day' }] },
  { id: 'down', about: 'mum', kind: 'mood', q: { en: 'This past week, how often have you felt down, low or hopeless?', pcm: 'This week, how often your mind don dey down, or you feel say no hope?' }, answers: [{ en: 'Not at all', pcm: 'At all' }, { en: 'Some days', pcm: 'Some days' }, { en: 'More than half the days', pcm: 'Pass half of the days' }, { en: 'Nearly every day', pcm: 'Almost every day' }] },
  { id: 'sleep', about: 'mum', kind: 'sleep', q: { en: 'How many hours do you sleep in a night, in total?', pcm: 'How many hours you dey sleep for one night, all together?' }, answers: [{ en: 'Less than 3', pcm: 'Less than 3' }, { en: '3 to 5', pcm: '3 to 5' }, { en: '5 to 7', pcm: '5 to 7' }, { en: 'More than 7', pcm: 'Pass 7' }] },
  { id: 'support', about: 'mum', kind: 'support', q: { en: 'Do you have someone helping you with the baby and the house?', pcm: 'Anybody dey help you with pikin and house work?' }, answers: [{ en: 'Yes, a lot', pcm: 'Yes, well well' }, { en: 'A little', pcm: 'Small' }, { en: 'No one', pcm: 'Nobody' }] },
  { id: 'harm', about: 'mum', kind: 'safety', q: { en: 'In the past week, have you had thoughts of harming yourself or your baby?', pcm: 'This week, you don think say make you harm yourself or your pikin?' }, answers: [{ en: 'No', pcm: 'No' }, { en: 'Yes', pcm: 'Yes' }] },
  { id: 'feeding', about: 'baby', kind: 'baby', q: { en: 'How is your baby feeding?', pcm: 'How your pikin dey feed?' }, answers: [{ en: 'Feeding well', pcm: 'E dey feed well' }, { en: 'Some trouble', pcm: 'Small wahala' }, { en: 'Not feeding well', pcm: 'E no dey feed well' }] },
];

/** Postpartum danger signs (mother). */
export const MUM_DANGER: L[] = [
  { en: 'Heavy bleeding, soaking a pad in an hour', pcm: 'Blood dey comot well well, e dey soak pad for one hour' },
  { en: 'Fits, or a very bad headache with blurred vision', pcm: 'Convulsion, or bad headache with eye wey dey blur' },
  { en: 'Fever, or a wound that is red, swollen and painful', pcm: 'Body dey hot, or wound don red, swell and dey pain' },
  { en: 'Chest pain or trouble breathing', pcm: 'Chest dey pain or you no fit breathe well' },
];
export const BABY_DANGER: L[] = [
  { en: 'Cannot feed, or vomits everything', pcm: 'E no fit feed, or e dey vomit everything' },
  { en: 'Has fits, or is very sleepy and hard to wake', pcm: 'E dey jerk, or e dey sleep too much and e hard to wake' },
  { en: 'Breathes fast, or feels very hot or very cold', pcm: 'E dey breathe fast, or body too hot or too cold' },
  { en: 'Yellow skin or eyes in the first days', pcm: 'Body or eye don yellow for the first days' },
];

/** Words that open "Need help now" immediately, before any AI call. */
export const SELF_HARM_TERMS = ['kill myself', 'end my life', 'suicide', 'hurt myself', 'harm myself', 'harm my baby', 'hurt my baby', 'want to die', "don't want to live", 'dont want to live', 'better off dead', 'i wan die', 'make i die', 'i no wan live', 'kill my baby', 'kill my pikin'];

/** Developmental milestones by age band (months). Simplified from CDC 2022. */
export const MILESTONES: { from: number; label: L; items: { id: string; t: L }[]; play: L }[] = [
  { from: 0, label: { en: 'First weeks', pcm: 'First weeks' }, items: [{ id: 'm0a', t: { en: 'Turns towards your voice', pcm: 'E dey turn to your voice' } }, { id: 'm0b', t: { en: 'Looks at your face', pcm: 'E dey look your face' } }, { id: 'm0c', t: { en: 'Calms when held and talked to', pcm: 'E dey calm when you carry am and talk' } }], play: { en: 'Hold your baby close, talk and sing. Your voice is the sound your baby loves most.', pcm: 'Carry your pikin close, talk and sing. Your voice na the sound wey e like pass.' } },
  { from: 2, label: { en: 'Around 2 months', pcm: 'Around 2 months' }, items: [{ id: 'm2a', t: { en: 'Smiles back at you', pcm: 'E dey smile back' } }, { id: 'm2b', t: { en: 'Watches your face as you move', pcm: 'E eye dey follow your face' } }, { id: 'm2c', t: { en: 'Makes cooing sounds', pcm: 'E dey make sweet small sound' } }], play: { en: 'Give tummy time a few minutes each day while awake, and copy the sounds your baby makes.', pcm: 'Put am for belle few minutes every day when e wake, and copy the sound wey e dey make.' } },
  { from: 4, label: { en: 'Around 4 months', pcm: 'Around 4 months' }, items: [{ id: 'm4a', t: { en: 'Holds head steady', pcm: 'E fit hold head steady' } }, { id: 'm4b', t: { en: 'Laughs', pcm: 'E dey laugh' } }, { id: 'm4c', t: { en: 'Brings hands to mouth', pcm: 'E dey put hand for mouth' } }], play: { en: 'Show your baby bright, safe objects to reach for. Talk about what you are doing.', pcm: 'Show am bright thing wey safe make e reach. Talk wetin you dey do.' } },
  { from: 6, label: { en: 'Around 6 months', pcm: 'Around 6 months' }, items: [{ id: 'm6a', t: { en: 'Rolls over', pcm: 'E fit turn over' } }, { id: 'm6b', t: { en: 'Reaches for toys', pcm: 'E dey reach for toy' } }, { id: 'm6c', t: { en: 'Makes babbling sounds', pcm: 'E dey talk baby talk' } }], play: { en: 'Start soft first foods and keep breastfeeding. Name each food as you feed.', pcm: 'Start soft first food and continue breastfeed. Call the food name as you dey feed am.' } },
  { from: 9, label: { en: 'Around 9 months', pcm: 'Around 9 months' }, items: [{ id: 'm9a', t: { en: 'Sits without support', pcm: 'E fit sit without help' } }, { id: 'm9b', t: { en: 'Turns when you call their name', pcm: 'E dey answer when you call im name' } }, { id: 'm9c', t: { en: 'Picks up food with fingers', pcm: 'E dey pick food with finger' } }], play: { en: 'Play peekaboo and let your baby pick up soft pieces of family food.', pcm: 'Play peekaboo and make e chop soft family food with im hand.' } },
  { from: 12, label: { en: 'Around 12 months', pcm: 'Around 12 months' }, items: [{ id: 'm12a', t: { en: 'Pulls up to stand', pcm: 'E dey hold thing stand up' } }, { id: 'm12b', t: { en: 'Waves bye-bye', pcm: 'E dey wave bye-bye' } }, { id: 'm12c', t: { en: 'Says "mama" or "dada"', pcm: 'E dey talk "mama" or "dada"' } }], play: { en: 'Read or tell short stories, point at pictures and name them.', pcm: 'Read or tell short story, point picture and call the name.' } },
];
export const milestoneBand = (ageMonths: number) => [...MILESTONES].reverse().find((m) => ageMonths >= m.from) ?? MILESTONES[0];

/** Nigeria routine immunisation schedule (NPHCDA). DRAFT: verify against the current NPHCDA schedule before launch;
 *  some states add or move doses (for example a second IPV dose or a 15-month Meningitis A dose). The clinic card always wins. */
export const VACCINE_VISITS: { id: string; atDays: number; label: L; doses: string[] }[] = [
  { id: 'v0', atDays: 0, label: { en: 'Birth', pcm: 'Birth' }, doses: ['BCG', 'OPV 0', 'Hepatitis B 0'] },
  { id: 'v6w', atDays: 42, label: { en: '6 weeks', pcm: '6 weeks' }, doses: ['Pentavalent 1', 'PCV 1', 'OPV 1', 'Rotavirus 1'] },
  { id: 'v10w', atDays: 70, label: { en: '10 weeks', pcm: '10 weeks' }, doses: ['Pentavalent 2', 'PCV 2', 'OPV 2', 'Rotavirus 2'] },
  { id: 'v14w', atDays: 98, label: { en: '14 weeks', pcm: '14 weeks' }, doses: ['Pentavalent 3', 'PCV 3', 'OPV 3', 'IPV'] },
  { id: 'v6m', atDays: 183, label: { en: '6 months', pcm: '6 months' }, doses: ['Vitamin A'] },
  { id: 'v9m', atDays: 274, label: { en: '9 months', pcm: '9 months' }, doses: ['Measles 1', 'Yellow fever', 'Meningitis A', 'Vitamin A'] },
  { id: 'v15m', atDays: 456, label: { en: '15 months', pcm: '15 months' }, doses: ['Measles 2'] },
];
export const visitTitle = (v: { label: L }, lang: 'en' | 'pcm') => (v.label.en === 'Birth' ? (lang === 'pcm' ? 'Birth vaccines' : 'Birth vaccines') : `${(lang === 'pcm' ? v.label.pcm : v.label.en).replace(' weeks', '-week').replace(' months', '-month')} ${lang === 'pcm' ? 'vaccine' : 'vaccines'}`);

/** Mum's plate: the 10 food groups in plain words (FAO MDD-W). Aim for 5 or more a day. */
export const MUM_GROUPS: { id: string; name: L; ex: L }[] = [
  { id: 'grains_roots_tubers', name: { en: 'Starchy foods', pcm: 'Starch food' }, ex: { en: 'rice, yam, garri, bread, pap', pcm: 'rice, yam, garri, bread, pap' } },
  { id: 'pulses', name: { en: 'Beans', pcm: 'Beans' }, ex: { en: 'beans, moi moi, akara', pcm: 'beans, moi moi, akara' } },
  { id: 'nuts_seeds', name: { en: 'Nuts and seeds', pcm: 'Groundnut and seed' }, ex: { en: 'groundnut, egusi', pcm: 'groundnut, egusi' } },
  { id: 'dairy', name: { en: 'Milk', pcm: 'Milk' }, ex: { en: 'milk, yoghurt', pcm: 'milk, yoghurt' } },
  { id: 'meat_poultry_fish', name: { en: 'Fish and meat', pcm: 'Fish and meat' }, ex: { en: 'fish, crayfish, meat, liver', pcm: 'fish, crayfish, meat, liver' } },
  { id: 'eggs', name: { en: 'Eggs', pcm: 'Egg' }, ex: { en: 'boiled or fried egg', pcm: 'boiled or fried egg' } },
  { id: 'dark_green_leafy_veg', name: { en: 'Green leaves', pcm: 'Green leaf' }, ex: { en: 'ugu, waterleaf, bitterleaf', pcm: 'ugu, waterleaf, bitterleaf' } },
  { id: 'other_vitamin_a_fruits_veg', name: { en: 'Orange foods', pcm: 'Orange food' }, ex: { en: 'pawpaw, mango, carrot, palm oil', pcm: 'pawpaw, mango, carrot, palm oil' } },
  { id: 'other_vegetables', name: { en: 'Other vegetables', pcm: 'Other vegetable' }, ex: { en: 'okro, tomato, garden egg', pcm: 'okro, tomato, garden egg' } },
  { id: 'other_fruits', name: { en: 'Other fruits', pcm: 'Other fruit' }, ex: { en: 'orange, banana, pineapple', pcm: 'orange, banana, pineapple' } },
];
export const MUM_ADD_ORDER = ['dark_green_leafy_veg', 'meat_poultry_fish', 'pulses', 'other_vitamin_a_fruits_veg', 'eggs', 'nuts_seeds', 'dairy', 'other_fruits', 'other_vegetables', 'grains_roots_tubers'];

/** Dr SweetMom knowledge base (doctor-checked notes the AI must stay within). */
export const NOTES: { id: string; title: string; keywords: string[]; body: string }[] = [
  { id: 'blues', title: 'Baby blues and postpartum depression', keywords: ['sad', 'cry', 'crying', 'low', 'down', 'depress', 'blues', 'hopeless', 'mind', 'tire', 'tired', 'overwhelm', 'anxious', 'worry'], body: 'Many mothers feel tearful and up and down in the first two weeks after birth. This is called the baby blues and usually passes. If low mood, crying, loss of interest or hopelessness lasts more than two weeks, or makes it hard to care for yourself or your baby, it may be postpartum depression. It is common, it is not your fault, and it can be treated. Talk to someone you trust and to a health worker. If you ever have thoughts of harming yourself or your baby, get help immediately.' },
  { id: 'sleep', title: 'Sleep and rest for new mothers', keywords: ['sleep', 'rest', 'night', 'awake', 'tired'], body: 'Sleep in short blocks when your baby sleeps. Ask someone to hold the baby while you rest. Keep night feeds calm and dim. Lack of sleep makes low mood worse, so asking for help is a strength, not a weakness.' },
  { id: 'spitup', title: 'Spitting up', keywords: ['vomit', 'spit', 'throw up', 'posset'], body: 'Small spit-ups after feeds are very common in the first months. If the baby is feeding well, gaining weight and wetting nappies, it is usually harmless. Hold the baby upright after feeds. Go to the clinic today if the vomit is green or bloody, the baby vomits everything, or stops feeding.' },
  { id: 'crying', title: 'A baby who cries a lot', keywords: ['cry', 'crying', 'colic', 'fuss', 'scream'], body: 'All babies cry, and crying often peaks around 6 to 8 weeks. Check if the baby is hungry, needs changing, is too hot or cold, or wants to be held. Walking, gentle rocking and skin-to-skin can help. If you feel overwhelmed, put the baby down safely and take a few minutes to breathe. Never shake a baby. See a health worker if crying comes with fever, poor feeding or a weak cry.' },
  { id: 'breastfeeding', title: 'Breastfeeding', keywords: ['breast', 'milk', 'latch', 'feed', 'nipple', 'suck', 'formula', 'water'], body: 'Give only breast milk for the first 6 months: no water, glucose or herbal drinks. Feed whenever the baby wants, at least 8 times in 24 hours. A good latch means a big mouthful of breast, not just the nipple. Sore nipples usually mean the latch needs fixing. If a breast is red, hot and painful with fever, see a health worker.' },
  { id: 'fever', title: 'Fever in a young baby', keywords: ['fever', 'hot', 'temperature', 'malaria'], body: 'In a baby under 2 months, any fever is a reason to go to the clinic the same day. In older babies, go to the clinic if fever lasts more than a day, or comes with poor feeding, fast breathing, fits or a very sleepy baby. Do not give medicine without a health worker\'s advice.' },
  { id: 'jaundice', title: 'Yellow skin (jaundice)', keywords: ['yellow', 'jaundice', 'eye'], body: 'Yellow skin or eyes in the first day of life, yellow palms or soles, or yellow that is getting worse needs a clinic visit the same day. Feed often. Do not rely on sunlight to treat jaundice.' },
  { id: 'vaccines', title: 'Vaccines', keywords: ['vaccine', 'immuni', 'injection', 'jab', 'clinic card'], body: 'Vaccines protect your baby from serious diseases. Follow the dates on the clinic card: birth, 6, 10 and 14 weeks, then 9 and 15 months. A mild fever or a sore spot after a vaccine is common. Bring the clinic card to every visit.' },
  { id: 'solids', title: 'Starting food at 6 months', keywords: ['food', 'solid', 'pap', 'eat', 'wean', '6 months', 'six months'], body: 'At 6 months, keep breastfeeding and start soft foods 2 to 3 times a day. Make pap thick and add groundnut paste and finely ground crayfish. Add mashed beans, yam with egg, mashed fish without bones, pawpaw and ripe plantain.' },
  { id: 'recovery', title: 'Your body after birth', keywords: ['bleed', 'blood', 'pad', 'wound', 'stitches', 'c-section', 'caesarean', 'pain', 'recovery', 'check'], body: 'Bleeding after birth slowly gets lighter over a few weeks. Rest, eat well, drink water and keep stitches or wounds clean and dry. Go to your 6-week postnatal check. Go to hospital now for heavy bleeding, fever, a painful red wound, a very bad headache or chest pain.' },
  { id: 'support', title: 'Asking for support', keywords: ['help', 'alone', 'husband', 'partner', 'family', 'mother-in-law', 'lonely'], body: 'Caring for a baby is a job for more than one person. Tell your partner or family exactly what would help: holding the baby, cooking, or letting you sleep. Your SweetMom Circle and mentor are there for you too.' },
];
export function findNotes(q: string, n = 3) {
  const x = q.toLowerCase();
  const scored = NOTES.map((a) => ({ a, s: a.keywords.reduce((acc, k) => acc + (x.includes(k) ? 1 : 0), 0) })).filter((v) => v.s > 0).sort((p, q2) => q2.s - p.s);
  return (scored.length ? scored.map((v) => v.a) : NOTES.filter((a) => a.id === 'support')).slice(0, n);
}
