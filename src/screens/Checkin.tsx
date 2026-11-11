import { useState } from 'react';
import { useStore, useL } from '../store';
import { Icon } from '../components';
import { CHECKIN } from '../content/firstyear';
import { scoreCheckin } from '../derive';
import { speak, stopSpeaking, listen, speechSupported } from '../ai';

/** Match a spoken answer to one of the options by its words. */
function matchSpoken(text: string, options: { en: string; pcm: string }[]) {
  const t = text.toLowerCase();
  let best = -1, bestScore = 0;
  options.forEach((o, i) => {
    const words = `${o.en} ${o.pcm}`.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 2);
    const sc = words.filter((w) => t.includes(w)).length;
    if (sc > bestScore) { best = i; bestScore = sc; }
  });
  return best;
}

export function Checkin({ onClose, onCrisis }: { onClose: (to?: 'doctor') => void; onCrisis: () => void }) {
  const { s, d } = useStore();
  const L = useL();
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [done, setDone] = useState<ReturnType<typeof scoreCheckin> | null>(null);
  const [heard, setHeard] = useState('');
  const [listening, setListening] = useState(false);
  const q = CHECKIN[i];
  const sel = answers[q?.id];
  const pick = (k: number) => {
    const a = { ...answers, [q.id]: k };
    setAnswers(a);
    if (q.kind === 'safety' && k === 1) {
      const c = scoreCheckin(a); d({ type: 'checkin', c }); stopSpeaking(); onCrisis();
    }
  };
  const next = () => {
    stopSpeaking(); setHeard('');
    if (i < CHECKIN.length - 1) setI(i + 1);
    else { const c = scoreCheckin(answers); d({ type: 'checkin', c }); setDone(c); }
  };
  const say = () => {
    if (!speechSupported()) { setHeard(L('Voice is not available on this phone yet. Please tap your answer.', 'Voice never dey work for this phone. Abeg touch your answer.')); return; }
    setListening(true); setHeard('');
    listen((p) => setHeard(p), (t) => { setListening(false); const k = matchSpoken(t, q.answers); if (k >= 0) pick(k); else setHeard(L(`We heard "${t}". Please tap the closest answer.`, `We hear "${t}". Abeg touch the answer wey near am.`)); }, () => { setListening(false); setHeard(L('We could not hear you. Please tap your answer.', 'We no hear you. Abeg touch your answer.')); });
  };
  const bname = s.baby?.name ?? L('your baby', 'your pikin');

  if (done) {
    const low = done.flags.includes('mood');
    return (
      <div className="plum-screen">
        <div className="row between"><span /><button className="close" aria-label={L('Close')} onClick={() => onClose()}><Icon n="x" /></button></div>
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(227,11,93,.10)', color: 'var(--rose)', display: 'grid', placeItems: 'center', marginTop: 24 }}><Icon n="heart" size={32} /></div>
        <h1 style={{ fontSize: 28, marginTop: 18 }}>{L('Thank you for checking in.', 'Thank you as you check in.')}</h1>
        <div className="glass" style={{ marginTop: 18, padding: 16 }}>
          <div className="eyebrow" style={{ color: 'var(--rose)' }}>{L('You')}</div>
          <p style={{ marginTop: 6, lineHeight: 1.5 }}>{low
            ? L('Your answers suggest you have been feeling low. Many new mothers feel this, and it gets better with support. Talking to someone is a strong first step.', 'Your answer show say your mind don dey down. Plenty new mama dey feel am, and e dey better with support. To talk to person na strong first step.')
            : L('You seem to be coping. Keep resting when you can and keep talking to people who care about you.', 'E be like say you dey cope. Continue to rest when you fit and talk to people wey care for you.')}</p>
          {done.flags.includes('sleep') && <p style={{ marginTop: 8, color: 'var(--peach-ink)', fontWeight: 700 }}>{L('You are sleeping very little. Ask someone to hold the baby so you can rest.', 'You no dey sleep well at all. Make person carry pikin so you fit rest.')}</p>}
          {done.flags.includes('support') && <p style={{ marginTop: 8, color: 'var(--peach-ink)', fontWeight: 700 }}>{L('Doing this alone is hard. Your Circle mentor can help you plan who to ask.', 'To do am alone hard. Your Circle mentor fit help you plan who to ask.')}</p>}
        </div>
        <div className="glass" style={{ marginTop: 10, padding: 16 }}>
          <div className="eyebrow" style={{ color: 'var(--sage-ink)' }}>{bname}</div>
          <p style={{ marginTop: 6, lineHeight: 1.5 }}>{done.flags.includes('feeding')
            ? L(`If ${bname} is not feeding well, please see your clinic today.`, `If ${bname} no dey feed well, abeg go clinic today.`)
            : L(`Feeding sounds good. Keep feeding ${bname} whenever ${s.baby?.sex === 'female' ? 'she wants' : 'he wants'}.`, `Feeding dey okay. Continue to feed ${bname} anytime e want.`)}</p>
        </div>
        <div style={{ flex: 1 }} />
        {low && <button className="btn blush block" style={{ marginTop: 18 }} onClick={() => onClose('doctor')}>{L('Talk to someone now', 'Talk to person now')}</button>}
        <button className="btn white block" style={{ marginTop: 10 }} onClick={() => onClose()}>{L('Done', 'Finish')}</button>
      </div>
    );
  }

  return (
    <div className="plum-screen">
      <div className="row">
        <button className="close" aria-label={L('Close check-in')} onClick={() => { stopSpeaking(); onClose(); }}><Icon n="x" /></button>
        <div className="dots" style={{ gridTemplateColumns: `repeat(${CHECKIN.length}, 1fr)` }} aria-label={L(`Question ${i + 1} of ${CHECKIN.length}`)}>
          {CHECKIN.map((_, k) => <span key={k} className={k <= i ? 'on' : ''} />)}
        </div>
      </div>
      <div className="tag-pill" style={{ marginTop: 32 }}><Icon n={q.about === 'mum' ? 'heart' : 'baby'} />{q.about === 'mum' ? L('About you') : L(`About ${s.baby?.name ?? 'baby'}`)}</div>
      <h1 style={{ marginTop: 16, fontSize: 27, lineHeight: 1.22 }}>{s.lang === 'pcm' ? q.q.pcm : q.q.en}</h1>
      <p style={{ marginTop: 10, color: 'var(--ink-3)', fontSize: 15 }}>{L('There is no wrong answer. Your answers stay private.', 'No wrong answer dey. Your answer go stay private.')}</p>
      <button className="link" style={{ color: 'var(--rose)', alignSelf: 'flex-start' }} onClick={() => speak(s.lang === 'pcm' ? q.q.pcm : q.q.en)}>{L('Read it to me', 'Read am give me')}</button>
      <div style={{ display: 'grid', gap: 10, marginTop: 14 }}>
        {q.answers.map((a, k) => (
          <button key={k} className="answer" aria-pressed={sel === k} onClick={() => pick(k)}>
            {s.lang === 'pcm' ? a.pcm : a.en}{sel === k && <Icon n="check" size={20} />}
          </button>
        ))}
      </div>
      {heard && <p className="sm" style={{ marginTop: 12, color: 'var(--ink-3)' }}>{heard}</p>}
      <div style={{ flex: 1, minHeight: 20 }} />
      <button className="btn" style={{ background: listening ? '#B8473C' : 'var(--plum-soft)', color: listening ? '#FFFFFF' : 'var(--plum-2)' }} onClick={say}>
        <Icon n="mic" size={20} />{listening ? L('Listening...', 'I dey listen...') : L('Say it instead, in English or Pidgin', 'Talk am instead, for English or Pidgin')}
      </button>
      <button className="btn blush block" style={{ marginTop: 10 }} disabled={sel == null} onClick={next}>{i < CHECKIN.length - 1 ? L('Next') : L('Finish', 'Finish')}</button>
    </div>
  );
}
