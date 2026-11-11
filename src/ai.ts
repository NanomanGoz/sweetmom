// Dr SweetMom AI adapter. Bounded: answers only from doctor-checked notes, never diagnoses or doses,
// and safety words are caught by rules before any call. In the claude.ai build it uses the viewer's Claude
// via the `sample` capability; in production, swap getSampler() for a server function.
import { findArticles } from './content/learn';
const findNotes = (q: string) => findArticles(q).map((a) => ({ id: a.id, title: a.title, body: a.body.join(' ') }));

import { cap, voice } from './platform';
type Sampler = ((input: string, opts?: Record<string, unknown>) => Promise<{ text: string }>);
export const getSampler = () => cap<Sampler>('sample');

export async function askDrSweetMom(question: string, ctx: { lang: 'en' | 'pcm'; babyWeeks?: number; babyName?: string; history: { who: string; text: string }[] }, onText?: (t: string) => void) {
  const s = await getSampler();
  const notes = findNotes(question + ' ' + ctx.history.slice(-2).map((h) => h.text).join(' '));
  if (!s) return { text: '', notes, offline: true };
  const prompt = `You are Dr SweetMom, a warm, calm guide for new mothers in Nigeria in the first year after birth.
Answer ONLY from the doctor-checked notes below. If the notes do not cover it, say you are not sure and suggest "Ask a doctor" or the clinic.
Never diagnose. Never name or dose a medicine. Never tell a mother to stop a treatment.
If anything suggests danger to mother or baby, say clearly to go to the clinic or hospital now.
Care for the mother as well as the baby: if she sounds low, acknowledge her feelings first.
Reply in ${ctx.lang === 'pcm' ? 'simple, natural Nigerian Pidgin' : 'simple, warm English'}. Under 110 words. Do not use lists.
Context: baby ${ctx.babyName ?? ''} is ${ctx.babyWeeks ?? '?'} weeks old.

DOCTOR-CHECKED NOTES:
${notes.map((n) => `## ${n.title}\n${n.body}`).join('\n\n')}

RECENT CHAT:
${ctx.history.slice(-4).map((h) => `${h.who}: ${h.text}`).join('\n')}

MOTHER: ${question}`;
  const r = await s(prompt, { modelTier: 'quick', cache: false, onText: onText ? (e: { text: string }) => onText(e.text) : undefined });
  return { text: r.text, notes, offline: false };
}

/** Speech: Claude dictation and voice inside claude.ai; browser speech elsewhere. Pidgin is heard as Nigerian English. */
type Rec = { lang: string; interimResults: boolean; continuous: boolean; start: () => void; stop: () => void; onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null; onend: (() => void) | null; onerror: (() => void) | null };
const browserRec = () => {
  const w = window as unknown as { SpeechRecognition?: new () => Rec; webkitSpeechRecognition?: new () => Rec };
  return w.SpeechRecognition || w.webkitSpeechRecognition;
};
export const speechSupported = () => !!voice.dict || !!browserRec();

/** Call directly from a click. Returns a stop function. */
export function listen(onPartial: (t: string) => void, onDone: (t: string) => void, onFail: () => void) {
  const d = voice.dict;
  if (d) {
    let text = ''; let started = false; let finished = false;
    const offs: (() => void)[] = [];
    const end = (ok: boolean) => { if (finished) return; finished = true; offs.forEach((f) => f()); ok ? onDone(text.trim()) : onFail(); };
    offs.push(d.onPartial((e: { text: string }) => onPartial(`${text} ${e.text}`.trim())));
    offs.push(d.onFinal((e: { text: string }) => { text = `${text} ${e.text}`.trim(); onPartial(text); }));
    offs.push(d.onState((e: { state: string; reason?: string }) => {
      if (e.state === 'listening') started = true;
      if (e.state === 'idle' && started) end(!!text || e.reason === 'stopped' || e.reason === 'viewer_stopped');
      if (e.state === 'idle' && !started && e.reason && e.reason !== 'stopped') end(false);
    }));
    d.start({ language: 'en' }).catch(() => end(false));
    return () => { d.stop().catch(() => {}); };
  }
  const C = browserRec();
  if (!C) { onFail(); return () => {}; }
  const r = new C();
  r.lang = 'en-NG'; r.interimResults = true; r.continuous = false;
  let text = '';
  r.onresult = (e) => { text = Array.from(e.results).map((x) => x[0].transcript).join(' '); onPartial(text); };
  r.onend = () => onDone(text.trim());
  r.onerror = () => onFail();
  try { r.start(); } catch { onFail(); }
  return () => { try { r.stop(); } catch { /* ignore */ } };
}
export function speak(text: string) {
  if (voice.tts) { voice.tts.speak(text.slice(0, 2000), { voice: 'airy', language: 'en' }).catch(() => {}); return; }
  try {
    const u = new SpeechSynthesisUtterance(text);
    const v = speechSynthesis.getVoices().find((x) => x.lang === 'en-NG') ?? speechSynthesis.getVoices().find((x) => x.lang.startsWith('en'));
    if (v) u.voice = v;
    speechSynthesis.cancel(); speechSynthesis.speak(u);
  } catch { /* speech not available */ }
}
export const stopSpeaking = () => {
  if (voice.tts) { voice.tts.stop().catch(() => {}); return; }
  try { speechSynthesis.cancel(); } catch { /* ignore */ }
};
