import { useEffect, useRef, useState } from 'react';
import { useCap, useViewer } from '../platform';
import { useStore, useL, uid } from '../store';
import { Icon, Mark } from '../components';
import { askDrSweetMom, listen, speak, speechSupported } from '../ai';
import { CONTACTS, waLink } from '../config/contacts';
import { babyWeeks, safetyCheck } from '../derive';

export function Doctor({ onHelp, onVoice, onClose, prefill }: { onHelp: () => void; onVoice: () => void; onClose: () => void; prefill?: string }) {
  const { s, d } = useStore();
  const L = useL();
  const [q, setQ] = useState(prefill ?? '');
  const [busy, setBusy] = useState(false);
  const [rec, setRec] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const db = useCap<any>('db');
  const { me } = useViewer();
  type TM = { who: 'mum' | 'doctor'; text: string; at: string };
  const [thread, setThread] = useState<{ messages: TM[]; status: string } | null>(null);
  const [follow, setFollow] = useState('');
  const [sending, setSending] = useState(false);
  useEffect(() => {
    if (!db || !me?.id) return;
    let unsub = () => {};
    try { unsub = db.doc(`doctorQuestions/${me.id}`).onSnapshot((snap: any) => setThread(snap.exists ? (snap.data() as { messages: TM[]; status: string }) : null), () => {}); } catch { /* ignore */ }
    return () => unsub();
  }, [db, me?.id]);
  const sendToDoctor = async (text: string) => {
    if (!db || !me?.id || !text.trim()) return false;
    setSending(true);
    const msg: TM = { who: 'mum', text: text.trim(), at: new Date().toISOString() };
    try {
      await db.doc(`doctorQuestions/${me.id}`).set({ messages: [...(thread?.messages ?? []), msg], status: 'open', updatedAt: msg.at, babyWeeks: babyWeeks(s) });
      return true;
    } catch { return false; } finally { setSending(false); }
  };
  useEffect(() => { endRef.current?.scrollIntoView({ block: 'end' }); }, [s.chat.length]);
  const bname = s.baby?.name ?? L('your baby', 'your pikin');
  const examples = s.lang === 'pcm'
    ? [`${bname} dey vomit small after e feed. E normal?`, 'I no dey sleep and I dey cry every day', 'When I go start to give am food?']
    : [`${bname} spits up after feeds. Is that normal?`, "I can't sleep and I cry every day", 'When should I start giving food?'];

  const send = async (text: string, voice = false) => {
    const t = text.trim();
    if (!t || busy) return;
    setQ('');
    d({ type: 'chat', m: { id: uid(), who: 'me', text: t, voice } });
    const flag = safetyCheck(t);
    if (flag === 'self_harm') {
      d({ type: 'chat', m: { id: uid(), who: 'sys', text: L('Thank you for telling me. You deserve help right now. Please talk to someone now using the button that has opened.', 'Thank you as you tell me. You deserve help now now. Abeg talk to person now with the button wey don open.') } });
      onHelp(); return;
    }
    if (flag === 'danger') {
      d({ type: 'chat', m: { id: uid(), who: 'sys', text: L('This could be serious. Please go to your clinic or hospital now.', 'This one fit serious. Abeg go clinic or hospital now now.') } });
      onHelp(); return;
    }
    if (!s.consent?.ai) {
      d({ type: 'chat', m: { id: uid(), who: 'sys', text: L('AI answers are turned off in Me > Settings. You can still ask a doctor.', 'AI answer dey off for Me > Settings. You fit still ask doctor.') } });
      return;
    }
    setBusy(true);
    const id = uid();
    d({ type: 'chat', m: { id, who: 'dr', text: '...' } });
    try {
      const r = await askDrSweetMom(t, { lang: s.lang, babyWeeks: babyWeeks(s), babyName: s.baby?.name, history: s.chat.slice(-4) }, (p) => d({ type: 'chatEdit', id, text: p }));
      const text2 = r.offline ? r.notes[0].body : r.text;
      d({ type: 'chatEdit', id, text: text2 });
      d({ type: 'chat', m: { id: uid(), who: 'sys', text: `${L('From', 'From')} "${r.notes[0].title}", ${L('checked by a SweetMom doctor', 'SweetMom doctor check am')}`, source: r.notes[0].id } });
    } catch {
      d({ type: 'chatEdit', id, text: L('Sorry, I could not answer right now. You can ask a doctor below.', 'Sorry, I no fit answer now. You fit ask doctor below.') });
    } finally { setBusy(false); }
  };
  const askDoctor = async () => {
    const lastQ = [...s.chat].reverse().find((m) => m.who === 'me')?.text ?? '';
    const ok = await sendToDoctor(lastQ);
    d({ type: 'chat', m: { id: uid(), who: 'sys', doctor: true, text: ok
      ? L('Sent to a SweetMom doctor. Their reply will appear below. If it is an emergency, go to hospital now.', 'We don send am to SweetMom doctor. Dem reply go show below. If na emergency, go hospital now.')
      : L('We could not reach a doctor from here yet. If you are worried, go to your clinic. If it is an emergency, go to hospital now.', 'We no fit reach doctor from here now. If e dey worry you, go clinic. If na emergency, go hospital now.') } });
  };
  const dictate = () => {
    if (!speechSupported()) { d({ type: 'chat', m: { id: uid(), who: 'sys', text: L('Voice is not available on this phone yet. Please type.', 'Voice never dey work for this phone. Abeg type.') } }); return; }
    setRec(true);
    listen((p) => setQ(p), (t) => { setRec(false); if (t) send(t, true); }, () => setRec(false));
  };

  return (
    <main className="page" style={{ paddingBottom: 120 }}>
      <div className="head">
        <button className="ghost-round" aria-label={L('Back')} onClick={onClose}><Icon n="back" /></button>
        <span aria-hidden><Mark size={40} /></span>
        <div style={{ flex: 1, lineHeight: 1.3 }}>
          <div style={{ fontSize: 17, fontWeight: 800 }}>Dr SweetMom</div>
          <div className="xs muted">{L('Doctor-checked answers. A real doctor joins when needed.', 'Answer wey doctor check. Real doctor go join when e need am.')}</div>
        </div>
        <button className="ghost-round" style={{ background: 'var(--plum-soft)', border: 0, color: 'var(--plum)' }} aria-label={L('Talk by voice')} onClick={onVoice}><Icon n="phone" size={20} /></button>
      </div>

      <div className="chat mt16" aria-live="polite">
        <div className="bubble dr">{L(`Hello ${s.mother?.name ?? ''}. I can help with questions about you and ${bname}: feeding, sleep, crying, your body after birth, and how you are feeling. You can type or talk, in English or Pidgin.`, `How far ${s.mother?.name ?? ''}. I fit help with question about you and ${bname}: feeding, sleep, crying, your body after birth, and how you dey feel. You fit type or talk, for English or Pidgin.`)}</div>
        {s.chat.length === 0 && (
          <div style={{ display: 'grid', gap: 8 }}>
            {examples.map((e) => <button key={e} className="card" style={{ textAlign: 'left', fontWeight: 600, fontSize: 15, padding: '12px 16px' }} onClick={() => send(e)}>{e}</button>)}
          </div>
        )}
        {s.chat.map((m) => m.who === 'me' ? (
          <div key={m.id} className="bubble me">{m.voice && <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, opacity: 0.85, marginBottom: 4 }}><Icon n="mic" size={14} />{L('Voice note')}</span>}{m.text}</div>
        ) : m.who === 'dr' ? (
          <div key={m.id} className="bubble dr">
            {m.text}
            {m.text !== '...' && <button className="link" style={{ display: 'flex', alignItems: 'center', gap: 6, paddingBottom: 0 }} onClick={() => speak(m.text)}><Icon n="play" size={16} />{L('Read aloud', 'Read am out')}</button>}
          </div>
        ) : (
          <div key={m.id} className="bubble sys">{m.source && <span style={{ color: 'var(--sage-ink)' }}>✓ </span>}{m.text}</div>
        ))}
        {s.chat.length > 0 && !s.chat.some((m) => m.doctor) && !thread && (
          <div className="tile t-plum row">
            <div style={{ flex: 1 }}><div style={{ fontWeight: 800 }}>{L('Still worried?', 'E still dey worry you?')}</div><div className="xs muted">{L('A SweetMom doctor can look at this and reply here.', 'SweetMom doctor fit look am and reply here.')}</div></div>
            <button className="btn sm" onClick={askDoctor}>{L('Ask a doctor')}</button>
          </div>
        )}
        {CONTACTS.whatsapp && s.chat.length > 0 && (
          <a className="btn sm wa-btn" style={{ alignSelf: 'flex-start' }} href={waLink('Hello SweetMom, I have a question:')} target="_blank" rel="noopener noreferrer"><Icon n="whatsapp" size={18} />{L('Continue on WhatsApp')}</a>
        )}
        {thread && (
          <section className="card" style={{ borderColor: 'var(--sage-ink)' }}>
            <div className="row between"><div style={{ fontWeight: 800 }}>{L('Your SweetMom doctor', 'Your SweetMom doctor')}</div><span className={`badge ${thread.status === 'answered' ? 'b-sage' : 'b-amber'}`}>{thread.status === 'answered' ? L('Replied') : L('Waiting for reply', 'Dey wait for reply')}</span></div>
            <div className="chat mt12">
              {thread.messages.map((m, i) => <div key={i} className={`bubble ${m.who === 'mum' ? 'me' : 'dr'}`} style={m.who === 'doctor' ? { borderColor: 'var(--sage-ink)' } : undefined}>{m.who === 'doctor' && <div className="xs" style={{ fontWeight: 800, color: 'var(--sage-ink)', marginBottom: 4 }}>{L('Doctor')}</div>}{m.text}</div>)}
            </div>
            <div className="composer mt12">
              <label htmlFor="fu" className="sr">{L('Reply to the doctor')}</label>
              <input id="fu" type="text" placeholder={L('Write to the doctor...', 'Write to doctor...')} value={follow} onChange={(e) => setFollow(e.target.value)} />
              <button className="round-plum" aria-label={L('Send to doctor')} disabled={sending || !follow.trim()} onClick={async () => { if (await sendToDoctor(follow)) setFollow(''); }}><Icon n="send" /></button>
            </div>
          </section>
        )}
        <div ref={endRef} />
      </div>

      <div className="chat-dock flow">
        <div className="in composer">
          <label htmlFor="ask" className="sr">{L('Ask Dr SweetMom')}</label>
          <input id="ask" type="text" placeholder={rec ? L('Listening...', 'I dey listen...') : L('Ask in English or Pidgin...', 'Ask for English or Pidgin...')} value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') send(q); }} />
          {q.trim()
            ? <button className="round-plum" aria-label={L('Send')} disabled={busy} onClick={() => send(q)}><Icon n="send" /></button>
            : <button className={`round-plum ${rec ? 'live' : ''}`} aria-label={L('Speak your question')} onClick={dictate}><Icon n="mic" /></button>}
        </div>
      </div>
    </main>
  );
}
