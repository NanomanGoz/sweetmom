// The first-year journey. Each stage lists what is happening, where mothers commonly struggle (failure points),
// and what SweetMom does about it. This drives Home, the "Your journey" screen, reminders and the Learn library.
// DRAFT for clinical lead review.
type L = { en: string; pcm: string };
export interface Stage {
  id: string; fromDay: number; toDay: number; name: L; tagline: L;
  struggles: L[]; risks: L[]; actions: { label: L; to: 'checkin' | 'epds' | 'circle' | 'doctor' | 'learn' | 'baby' | 'vaccines' | 'help' | 'whatsapp' }[];
  learn: string[];
}

export const STAGES: Stage[] = [
  {
    id: 'first-days', fromDay: 0, toDay: 7,
    name: { en: 'The first days', pcm: 'The first days' },
    tagline: { en: 'Healing, feeding and learning your baby.', pcm: 'Body dey heal, you dey learn your pikin.' },
    struggles: [
      { en: 'Pain, bleeding and very little sleep', pcm: 'Pain, bleeding and small sleep' },
      { en: 'Getting breastfeeding started, sore nipples, worry about "enough milk"', pcm: 'To start breastfeeding, nipple wey dey pain, fear say milk no reach' },
      { en: 'Tears and mood swings (baby blues)', pcm: 'Cry and mood wey dey change (baby blues)' },
    ],
    risks: [
      { en: 'Heavy bleeding, fever, fits or high blood pressure in the mother', pcm: 'Heavy bleeding, fever, convulsion or high BP for mama' },
      { en: 'Newborn jaundice, poor feeding, cold or hot baby', pcm: 'Pikin yellow, no dey feed well, too cold or too hot' },
    ],
    actions: [
      { label: { en: 'Know the danger signs', pcm: 'Know the danger signs' }, to: 'help' },
      { label: { en: 'Help with breastfeeding', pcm: 'Help with breastfeeding' }, to: 'learn' },
      { label: { en: 'Ask Dr SweetMom', pcm: 'Ask Dr SweetMom' }, to: 'doctor' },
    ],
    learn: ['danger-mum', 'danger-baby', 'breastfeeding-start', 'baby-blues', 'cord-care', 'jaundice'],
  },
  {
    id: 'fourth-trimester', fromDay: 8, toDay: 42,
    name: { en: 'The fourth trimester', pcm: 'The fourth trimester' },
    tagline: { en: 'Visitors leave, the nights are long. This is when many mums feel most alone.', pcm: 'Visitors don go, night long. Na here plenty mama dey feel alone pass.' },
    struggles: [
      { en: 'Exhaustion and broken sleep', pcm: 'Tiredness and broken sleep' },
      { en: 'Feeling alone once family support fades', pcm: 'To feel alone when family help don reduce' },
      { en: 'Pressure to give water, glucose or herbal drinks', pcm: 'Pressure to give water, glucose or agbo' },
      { en: 'Crying that will not stop (it peaks around 6 weeks)', pcm: 'Cry wey no gree stop (e dey high around 6 weeks)' },
    ],
    risks: [
      { en: 'Baby blues turning into postnatal depression or anxiety', pcm: 'Baby blues wey fit turn postnatal depression or anxiety' },
      { en: 'Missed 6-week vaccines and missed postnatal check', pcm: 'To miss 6-week vaccine and postnatal check' },
    ],
    actions: [
      { label: { en: 'Join your Circle', pcm: 'Join your Circle' }, to: 'circle' },
      { label: { en: 'Do your 2-minute check-in', pcm: 'Do your check-in' }, to: 'checkin' },
      { label: { en: '6-week vaccines', pcm: '6-week vaccine' }, to: 'vaccines' },
    ],
    learn: ['crying', 'sleep-mum', 'exclusive-bf', 'ppd', 'asking-help', 'postnatal-check'],
  },
  {
    id: 'finding-rhythm', fromDay: 43, toDay: 90,
    name: { en: 'Finding your rhythm', pcm: 'Finding your rhythm' },
    tagline: { en: 'Smiles arrive. So can tiredness that does not lift.', pcm: 'Pikin don dey smile. But tiredness fit no gree comot.' },
    struggles: [
      { en: 'Sleep debt and doing everything alone', pcm: 'Sleep debt and to do everything alone' },
      { en: 'Your own body: pain, sex, family planning', pcm: 'Your own body: pain, sex, family planning' },
      { en: 'Partner and family not knowing how to help', pcm: 'Husband and family no know how to help' },
    ],
    risks: [
      { en: 'Postnatal depression often shows up now, and is often missed', pcm: 'Postnatal depression dey show for this time, and people dey miss am' },
      { en: 'Missed 10 and 14-week vaccines', pcm: 'To miss 10 and 14-week vaccine' },
    ],
    actions: [
      { label: { en: 'Take the wellbeing screen', pcm: 'Do the wellbeing check' }, to: 'epds' },
      { label: { en: 'Talk to your Supermom', pcm: 'Talk to your Supermom' }, to: 'circle' },
      { label: { en: 'Family planning after birth', pcm: 'Family planning after birth' }, to: 'learn' },
    ],
    learn: ['ppd', 'family-planning', 'partner', 'play-early', 'vaccines'],
  },
  {
    id: 'back-to-world', fromDay: 91, toDay: 182,
    name: { en: 'Back to the world', pcm: 'Back to the world' },
    tagline: { en: 'Work, money and the pull to stop breastfeeding early.', pcm: 'Work, money and pressure to stop breastfeeding early.' },
    struggles: [
      { en: 'Going back to work or trade', pcm: 'To go back to work or market' },
      { en: 'Keeping breastfeeding going: expressing and storing milk', pcm: 'To continue breastfeeding: to express and keep milk' },
      { en: 'Pressure to start pap or water before 6 months', pcm: 'Pressure to start pap or water before 6 months' },
    ],
    risks: [
      { en: 'Exclusive breastfeeding drops off', pcm: 'Only breast milk dey stop early' },
      { en: 'Low mood that has been carried for months', pcm: 'Low mood wey you don carry for months' },
    ],
    actions: [
      { label: { en: 'Expressing milk for work', pcm: 'Express milk for work' }, to: 'learn' },
      { label: { en: 'Check in with your Circle', pcm: 'Check in with your Circle' }, to: 'circle' },
      { label: { en: 'Get ready for first foods', pcm: 'Ready for first food' }, to: 'learn' },
    ],
    learn: ['expressing', 'return-work', 'exclusive-bf', 'ppd', 'first-foods'],
  },
  {
    id: 'first-foods', fromDay: 183, toDay: 273,
    name: { en: 'First foods', pcm: 'First food' },
    tagline: { en: 'Breast milk plus thick, varied, iron-rich food.', pcm: 'Breast milk plus thick food wey get iron and plenty kind.' },
    struggles: [
      { en: 'Pap that is too thin, or the same food every day', pcm: 'Pap wey too light, or the same food every day' },
      { en: 'Fussy eating and not knowing how much is enough', pcm: 'Pikin wey no gree chop, and to no know how much reach' },
      { en: 'Cost of good food', pcm: 'Cost of good food' },
    ],
    risks: [
      { en: 'Slow growth and anaemia', pcm: 'Slow growth and low blood' },
      { en: 'Diarrhoea from unsafe food or water', pcm: 'Purge from food or water wey no clean' },
    ],
    actions: [
      { label: { en: "Track your baby's food", pcm: 'Track pikin food' }, to: 'baby' },
      { label: { en: 'Baby recipes', pcm: 'Pikin recipe' }, to: 'learn' },
      { label: { en: 'Weigh at the clinic', pcm: 'Weigh am for clinic' }, to: 'baby' },
    ],
    learn: ['first-foods', 'food-safety', 'diarrhoea', 'growth'],
  },
  {
    id: 'on-the-move', fromDay: 274, toDay: 365,
    name: { en: 'On the move', pcm: 'E don dey move' },
    tagline: { en: 'Crawling, first words, and nine-month vaccines.', pcm: 'Crawling, first words, and nine-month vaccine.' },
    struggles: [
      { en: 'Keeping a mobile baby safe', pcm: 'To keep pikin wey dey move safe' },
      { en: 'Your own health has slipped down the list', pcm: 'Your own health don go back of the list' },
      { en: 'Spacing the next pregnancy', pcm: 'To space the next belle' },
    ],
    risks: [
      { en: 'Missed 9-month measles and yellow fever vaccines', pcm: 'To miss 9-month measles and yellow fever vaccine' },
      { en: 'Choking, burns and falls', pcm: 'Choking, burn and fall' },
    ],
    actions: [
      { label: { en: '9-month vaccines', pcm: '9-month vaccine' }, to: 'vaccines' },
      { label: { en: 'Home safety', pcm: 'Home safety' }, to: 'learn' },
      { label: { en: 'Check in on you', pcm: 'Check in on you' }, to: 'checkin' },
    ],
    learn: ['safety', 'family-planning', 'vaccines', 'development-9-12'],
  },
];

export const stageFor = (day: number) => STAGES.find((s) => day >= s.fromDay && day <= s.toDay) ?? STAGES[STAGES.length - 1];
