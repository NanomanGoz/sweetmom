import { daysBetween, ageInMonths, detectDangerTerms } from './engine/clinical';
import { assessGrowth, checkFaltering, type GrowthFlag } from './engine/growth';
import { CHECKIN, VACCINE_VISITS, SELF_HARM_TERMS, visitTitle } from './content/firstyear';
import { emptyState, todayIso, addDays, uid, type State, type Checkin } from './store';

export const babyDays = (s: State) => (s.baby ? Math.max(0, daysBetween(s.baby.dob, todayIso())) : 0);
export const babyWeeks = (s: State) => Math.floor(babyDays(s) / 7);
export const babyMonths = (s: State) => (s.baby ? Math.max(0, ageInMonths(s.baby.dob, todayIso())) : 0);
export const ageLabel = (s: State, L: (en: string, pcm?: string) => string) => {
  const w = babyWeeks(s);
  if (w < 13) return `${w} ${L('weeks old', 'weeks old')}`;
  return `${Math.floor(babyMonths(s))} ${L('months old', 'months old')}`;
};

export const lastCheckin = (s: State) => s.checkins[s.checkins.length - 1];
export const checkinDue = (s: State) => { const c = lastCheckin(s); return !c || daysBetween(c.date, todayIso()) >= 7; };

/** Scores a finished check-in. Mood = PHQ-2 style (0 to 6); 3 or more suggests talking to someone. */
export function scoreCheckin(answers: Record<string, number>): Checkin {
  const moodScore = (answers.interest ?? 0) + (answers.down ?? 0);
  const selfHarm = answers.harm === 1;
  const flags: string[] = [];
  if (moodScore >= 3) flags.push('mood');
  if ((answers.sleep ?? 3) === 0) flags.push('sleep');
  if ((answers.support ?? 0) === 2) flags.push('support');
  if ((answers.feeding ?? 0) === 2) flags.push('feeding');
  return { id: uid(), date: todayIso(), answers, moodScore, selfHarm, flags };
}
export const CHECKIN_IDS = CHECKIN.map((q) => q.id);

export type VaxStatus = 'done' | 'overdue' | 'due' | 'soon' | 'later';
/** Status of each visit: due = within a week either side, overdue = more than 7 days late, soon = within 21 days. */
export function vaccinePlan(s: State) {
  if (!s.baby) return [];
  const age = babyDays(s);
  return VACCINE_VISITS.map((v) => {
    const given = s.vaccines[v.id];
    const dueDate = addDays(s.baby!.dob, v.atDays);
    const inDays = v.atDays - age;
    const status: VaxStatus = given ? 'done' : inDays < -7 ? 'overdue' : inDays <= 7 ? 'due' : inDays <= 21 ? 'soon' : 'later';
    return { ...v, dueDate, inDays, status, givenOn: typeof given === 'string' ? given : null };
  });
}
export function nextVaccine(s: State) {
  return vaccinePlan(s).find((v) => v.status !== 'done') ?? null;
}

/** Calendar file with one all-day event per upcoming visit and a reminder the day before. */
export function vaccineIcs(s: State) {
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//SweetMom//Vaccines//EN', 'CALSCALE:GREGORIAN'];
  const stamp = new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z';
  for (const v of vaccinePlan(s).filter((x) => x.status !== 'done')) {
    const day = (v.inDays < 0 ? todayIso() : v.dueDate).replace(/-/g, '');
    const next = addDays(v.inDays < 0 ? todayIso() : v.dueDate, 1).replace(/-/g, '');
    lines.push('BEGIN:VEVENT', `UID:${v.id}-${s.baby?.dob}@sweetmom`, `DTSTAMP:${stamp}`, `DTSTART;VALUE=DATE:${day}`, `DTEND;VALUE=DATE:${next}`,
      `SUMMARY:${s.baby?.name}: ${visitTitle(v, 'en')}`, `DESCRIPTION:${v.doses.join(', ')}. Bring the clinic card.`,
      'BEGIN:VALARM', 'TRIGGER:-P1D', 'ACTION:DISPLAY', `DESCRIPTION:${s.baby?.name}'s vaccines are tomorrow`, 'END:VALARM', 'END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

/** Save a file: the claude.ai downloads capability when present, otherwise a normal browser download. */
export async function saveFile(name: string, data: string, type: string) {
  const blob = new Blob([data], { type });
  const c = (window as unknown as { claude?: { use: (n: string) => Promise<unknown> } }).claude;
  const dl = c?.use ? ((await c.use('downloads').catch(() => null)) as { save: (x: { filename: string; data: Blob }) => Promise<unknown> } | null) : null;
  if (dl) { await dl.save({ filename: name, data: blob }).catch(() => {}); return; }
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click();
}

export function growthStatus(s: State): { flags: GrowthFlag[]; latest?: State['growth'][number]; agoDays?: number } {
  if (!s.baby) return { flags: [] };
  const w = s.growth.filter((g) => g.weightKg != null);
  const latest = w[w.length - 1];
  if (!latest) return { flags: [] };
  const flags: GrowthFlag[] = [];
  try {
    const am = ageInMonths(s.baby.dob, latest.date);
    if (am <= 24) flags.push(...assessGrowth(s.baby.sex, { measuredOn: latest.date, ageMonths: am, weightKg: latest.weightKg, lengthCm: latest.lengthCm }).flags);
  } catch { /* outside table range */ }
  const prev = w[w.length - 2];
  if (prev) { const f = checkFaltering({ measuredOn: prev.date, ageMonths: 0, weightKg: prev.weightKg }, { measuredOn: latest.date, ageMonths: 0, weightKg: latest.weightKg }); if (f) flags.push(f); }
  return { flags, latest, agoDays: daysBetween(latest.date, todayIso()) };
}

/** Rules that run before any AI call. */
export function safetyCheck(text: string): 'self_harm' | 'danger' | null {
  const t = ` ${text.toLowerCase().replace(/[^\p{L}\p{N}\s']/gu, ' ').replace(/\s+/g, ' ')} `;
  if (SELF_HARM_TERMS.some((k) => t.includes(` ${k} `) || t.includes(` ${k}`))) return 'self_harm';
  return detectDangerTerms(text).length ? 'danger' : null;
}

export function demoState(lang: State['lang']): State {
  const today = todayIso();
  const dob = addDays(today, -63);
  const mk = (daysAgo: number, interest: number, down: number, sleep: number): Checkin => {
    const c = scoreCheckin({ interest, down, sleep, support: 1, harm: 0, feeding: 0 });
    return { ...c, date: addDays(today, -daysAgo) };
  };
  return {
    ...emptyState, lang, demo: true, guideSeen: true,
    consent: { at: new Date().toISOString(), ai: true },
    mother: { name: 'Ada', area: 'Rumuola' },
    baby: { name: 'Chidi', sex: 'male', dob },
    checkins: [mk(28, 1, 1, 1), mk(21, 2, 2, 0), mk(14, 1, 2, 1), mk(7, 1, 1, 1)],
    growth: [{ id: uid(), date: dob, weightKg: 3.2, lengthCm: 50 }, { id: uid(), date: addDays(dob, 42), weightKg: 4.8, lengthCm: 56 }, { id: uid(), date: addDays(today, -14), weightKg: 5.4, lengthCm: 58 }],
    milestones: { m0a: true, m0b: true, m0c: true, m2a: true, m2b: true },
    vaccines: { v0: dob, v6w: addDays(dob, 43) },
    mumFood: [{ date: today, groups: ['grains_roots_tubers', 'pulses', 'meat_poultry_fish'] }],
    moods: [{ date: addDays(today, -2), v: 1 }, { date: addDays(today, -1), v: 2 }],
    epds: [],
    circle: {
      joined: true, going: false,
      posts: [
        { id: uid(), author: 'Blessing', initial: 'B', tint: 'baby', text: "Is anyone else's baby awake all night this week? I'm so tired I could cry.", at: '2 h', replies: 6 },
        { id: uid(), author: 'Tamara', initial: 'T', tint: 'mum', text: 'What helped me with latching', voiceSecs: 24, at: '5 h', replies: 3 },
        { id: uid(), author: 'Nkechi (Supermom)', initial: 'N', tint: 'peach', text: 'Reminder: our meetup is Saturday at 10 am at Rumuola health centre. Bring your baby, we will talk about sleep. You are all doing well.', at: '1 d', replies: 9, mentor: true },
      ],
    },
    chat: [],
  };
}
