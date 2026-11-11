import { useState } from 'react';
import { useStore, useL, uid } from '../store';
import { Icon, Mark } from '../components';
import { askDrSweetMom, listen, speak, stopSpeaking, speechSupported } from '../ai';
import { babyWeeks, safetyCheck } from '../derive';

export function Voice({ onClose, onType, onHelp }: { onClose: () => void; onType: () => void; onHelp: () => void }) {
  const { s, d } = useStore();
  const L = useL();
  const [state, setState] = useState<'idle' | 'listening' | 'thinking' | 'speaking'>('idle');
  const [heard, setHeard] = useState('');
  const [reply, setReply] = useState(L('Tap the circle and talk to me. I am listening.', 'Touch the circle and talk to me. I dey listen.'));
  const ok = speechSupported();

  const handle = async (t: string) => {
    if (!t) { setState('idle'); setReply(L('I did not hear anything. Tap and try again.', 'I no hear anything. Touch am try again.')); return; }
    d({ type: 'chat', m: { id: uid(), who: 'me', text: t, voice: true } });
    const flag = safetyCheck(t);
    if (flag) { setState('idle'); stopSpeaking(); onHelp(); return; }
    setState('thinking');
    try {
      const r = await askDrSweetMom(t, { lang: s.lang, babyWeeks: babyWeeks(s), babyName: s.baby?.name, history: s.chat.slice(-4) }, (p) => setReply(p));
      const text = r.offline ? r.notes[0].body : r.text;
      setReply(text);
      d({ type: 'chat', m: { id: uid(), who: 'dr', text } });
      setState('speaking'); speak(text);
      setTimeout(() => setState('idle'), 1500);
    } catch { setState('idle'); setReply(L('Sorry, I could not answer right now.', 'Sorry, I no fit answer now.')); }
  };
  const talk = () => {
    stopSpeaking();
    if (!ok) return;
    setState('listening'); setHeard('');
    listen((p) => setHeard(p), (t) => handle(t), () => { setState('idle'); setReply(L('I could not hear you. Please allow the microphone, or type instead.', 'I no hear you. Allow microphone, or type am instead.')); });
  };

  return (
    <div className="plum-screen" style={{ alignItems: 'center' }}>
      <div className="row between" style={{ width: '100%' }}>
        <button className="close" aria-label={L('End and go back')} onClick={() => { stopSpeaking(); onClose(); }}><Icon n="back" /></button>
        <div className="seg" style={{ width: 170 }}>
          <button aria-pressed={s.lang === 'en'} onClick={() => d({ type: 'set', patch: { lang: 'en' } })}>English</button>
          <button aria-pressed={s.lang === 'pcm'} onClick={() => d({ type: 'set', patch: { lang: 'pcm' } })}>Pidgin</button>
        </div>
        <span style={{ width: 44 }} />
      </div>
      <div className="sm" style={{ marginTop: 22, color: 'var(--ink-3)', fontWeight: 600 }}>{L('Talking with', 'You dey talk with')}</div>
      <div style={{ fontSize: 24, fontWeight: 800 }}>Dr SweetMom</div>
      <div className="xs" style={{ marginTop: 6, fontWeight: 700, color: 'var(--sage-ink)' }}>
        {state === 'listening' ? L('Listening...', 'I dey listen...') : state === 'thinking' ? L('Thinking...', 'I dey think...') : state === 'speaking' ? L('Speaking', 'I dey talk') : L('Ready', 'Ready')}
      </div>

      <button onClick={talk} disabled={!ok || state === 'thinking'} aria-label={L('Tap to talk', 'Touch to talk')} style={{ flex: 1, minHeight: 240, width: '100%', border: 0, background: 'none', display: 'grid', placeItems: 'center', position: 'relative', color: 'inherit' }}>
        <span style={{ position: 'absolute', width: 260, height: 260, borderRadius: '50%', background: 'rgba(227,11,93,.05)' }} className={state === 'listening' ? 'pulse' : ''} />
        <span style={{ position: 'absolute', width: 200, height: 200, borderRadius: '50%', background: 'rgba(227,11,93,.08)' }} />
        <span style={{ position: 'absolute', width: 145, height: 145, borderRadius: '50%', background: 'rgba(227,11,93,.12)' }} />
        <span style={{ position: 'relative' }}><Mark size={110} tone="soft" /></span>
      </button>

      {!ok && <p className="sm" style={{ textAlign: 'center', color: 'var(--peach-ink)', fontWeight: 700 }}>{L('Voice is not available on this phone or browser yet. Use typing instead.', 'Voice never dey work for this phone. Use typing instead.')}</p>}
      {heard && (
        <div className="glass" style={{ width: '100%', padding: 14, borderRadius: 20 }}>
          <div className="eyebrow" style={{ color: 'var(--rose)' }}>{L('You said', 'You talk')}</div>
          <div style={{ marginTop: 4, lineHeight: 1.45 }}>"{heard}"</div>
        </div>
      )}
      <p style={{ width: '100%', marginTop: 10, fontSize: 15, lineHeight: 1.5, color: 'var(--ink-3)', maxHeight: 160, overflowY: 'auto' }}>{reply}</p>

      <div className="row between" style={{ width: '100%', marginTop: 18 }}>
        <button className="close" style={{ width: 58, height: 58, background: 'var(--sunk)', border: 0 }} aria-label={L('Read the answer again')} onClick={() => speak(reply)}><Icon n="play" /></button>
        <button onClick={() => { stopSpeaking(); onClose(); }} aria-label={L('End conversation')} style={{ width: 76, height: 76, borderRadius: '50%', border: 0, background: '#B8473C', color: '#fff', display: 'grid', placeItems: 'center' }}><Icon n="x" size={28} /></button>
        <button className="close" style={{ width: 58, height: 58, background: 'var(--sunk)', border: 0 }} aria-label={L('Switch to typing')} onClick={() => { stopSpeaking(); onType(); }}><Icon n="keyboard" /></button>
      </div>
    </div>
  );
}
