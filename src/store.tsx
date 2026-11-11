// Local-first state. Everything stays on this phone. No account, no server copy in this prototype.
import { createContext, useContext, useEffect, useReducer, type ReactNode } from 'react';
import type { Sex } from './engine/data';

export type Lang = 'en' | 'pcm';
export interface Checkin { id: string; date: string; answers: Record<string, number>; moodScore: number; selfHarm: boolean; flags: string[] }
export interface GrowthEntry { id: string; date: string; weightKg?: number; lengthCm?: number }
export interface Post { id: string; author: string; initial: string; tint: 'mum' | 'baby' | 'peach'; text: string; voiceSecs?: number; at: string; replies: number; mine?: boolean; mentor?: boolean }
export interface ChatMsg { id: string; who: 'me' | 'dr' | 'sys'; text: string; voice?: boolean; source?: string; doctor?: boolean }

export interface State {
  lang: Lang;
  consent?: { at: string; ai: boolean };
  mother?: { name: string; area: string };
  baby?: { name: string; sex: Sex; dob: string };
  guideSeen?: boolean;
  checkins: Checkin[];
  growth: GrowthEntry[];
  milestones: Record<string, boolean>;
  vaccines: Record<string, boolean | string>; // visit id -> date given (or true)
  reminders: boolean;
  mumFood: { date: string; groups: string[] }[];
  moods: { date: string; v: number }[]; // 0 great .. 4 struggling
  epds: { date: string; babyDay: number; total: number; band: string; selfHarm: boolean }[];
  feeding: { date: string; breastmilk: boolean; other: string[]; groups: string[] }[];
  postnatalCheck: 'not_booked' | 'booked' | 'done';
  circle: { joined: boolean; going: boolean; posts: Post[] };
  chat: ChatMsg[];
  demo: boolean;
}

export const emptyState: State = {
  lang: 'en', checkins: [], growth: [], milestones: {}, vaccines: {}, feeding: [], postnatalCheck: 'not_booked', reminders: true, mumFood: [], moods: [], epds: [],
  circle: { joined: false, going: false, posts: [] }, chat: [], demo: false,
};

type Action = { type: 'set'; patch: Partial<State> } | { type: 'replace'; state: State } | { type: 'reset' }
  | { type: 'checkin'; c: Checkin } | { type: 'growth'; g: GrowthEntry } | { type: 'chat'; m: ChatMsg } | { type: 'chatEdit'; id: string; text: string }
  | { type: 'post'; p: Post } | { type: 'toggleMilestone'; id: string } | { type: 'vaccine'; id: string; date: string | null } | { type: 'feeding'; f: State['feeding'][number] } | { type: 'mumFood'; date: string; groups: string[] } | { type: 'mood'; date: string; v: number } | { type: 'epds'; r: State['epds'][number] };

function reducer(s: State, a: Action): State {
  switch (a.type) {
    case 'set': return { ...s, ...a.patch };
    case 'replace': return a.state;
    case 'reset': return { ...emptyState, lang: s.lang };
    case 'checkin': return { ...s, checkins: [...s.checkins, a.c] };
    case 'growth': return { ...s, growth: [...s.growth, a.g].sort((x, y) => x.date.localeCompare(y.date)) };
    case 'chat': return { ...s, chat: [...s.chat, a.m] };
    case 'chatEdit': return { ...s, chat: s.chat.map((m) => (m.id === a.id ? { ...m, text: a.text } : m)) };
    case 'post': return { ...s, circle: { ...s.circle, posts: [a.p, ...s.circle.posts] } };
    case 'toggleMilestone': return { ...s, milestones: { ...s.milestones, [a.id]: !s.milestones[a.id] } };
    case 'vaccine': { const v = { ...s.vaccines }; if (a.date) v[a.id] = a.date; else delete v[a.id]; return { ...s, vaccines: v }; }
    case 'mood': return { ...s, moods: [...s.moods.filter((m) => m.date !== a.date), { date: a.date, v: a.v }] };
    case 'epds': return { ...s, epds: [...s.epds, a.r] };
    case 'mumFood': return { ...s, mumFood: [...s.mumFood.filter((f) => f.date !== a.date), { date: a.date, groups: a.groups }] };
    case 'feeding': return { ...s, feeding: [...s.feeding.filter((f) => f.date !== a.f.date), a.f] };
  }
}

const KEY = 'sweetmom.firstyear.v1';
function load(): State {
  try { const raw = localStorage.getItem(KEY); if (raw) return { ...emptyState, ...JSON.parse(raw) }; } catch { /* storage unavailable */ }
  return emptyState;
}
const Ctx = createContext<{ s: State; d: (a: Action) => void } | null>(null);
export function StoreProvider({ children }: { children: ReactNode }) {
  const [s, d] = useReducer(reducer, undefined, load);
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* storage unavailable */ } }, [s]);
  return <Ctx.Provider value={{ s, d }}>{children}</Ctx.Provider>;
}
export function useStore() { const c = useContext(Ctx); if (!c) throw new Error('StoreProvider missing'); return c; }

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
export const todayIso = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
export const addDays = (iso: string, n: number) => { const [y, m, dd] = iso.split('-').map(Number); return new Date(Date.UTC(y, m - 1, dd + n)).toISOString().slice(0, 10); };

/** Plain bilingual strings: L('English', 'Pidgin'). Pidgin is a DRAFT for native-speaker review. */
export function useL() {
  const { s } = useStore();
  return (en: string, pcm?: string) => (s.lang === 'pcm' && pcm ? pcm : en);
}
