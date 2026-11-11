import { useState } from 'react';
import { useStore, useL, todayIso, addDays } from '../store';
import { Icon, Mark, Wordmark } from '../components';
import { demoState } from '../derive';

const SLIDES = [
  { k: 'mark', en: ['No mother goes through the first year alone.', 'It takes a healthy mom to raise a healthy baby. SweetMom walks with you and your baby, every week of the first year.'], pcm: ['No mama go waka the first year alone.', 'Na healthy mama dey raise healthy pikin. SweetMom go waka with you and your pikin, every week of the first year.'] },
  { k: 'checkin', en: ['We check on you, not just the baby', 'A one-tap "How are you today?", a 2-minute weekly check-in and a trusted wellbeing screen help us notice early when you need more support.'], pcm: ['We dey check on you, no be only pikin', 'One touch "How you dey today?", small weekly check-in and wellbeing check go help us see early when you need more support.'] },
  { k: 'circle', en: ['Your Supermom and your Circle', 'Meet mums near you with babies the same age, in the app, on WhatsApp and in person. Your Circle is led by a Supermom: an experienced mum trained by SweetMom.'], pcm: ['Your Supermom and your Circle', 'Meet mamas near you wey their pikin be the same age, for app, WhatsApp and face to face. Supermom, experienced mama wey SweetMom train, dey lead your Circle.'] },
  { k: 'doctor', en: ['Answers, any time of night', 'Ask Dr SweetMom by typing or talking, in English or Pidgin, and read short doctor-checked guides. The red "Need help now" button is always there.'], pcm: ['Answer, any time for night', 'Ask Dr SweetMom by typing or talking, for English or Pidgin, and read short guide wey doctor check. The red "I need help now" button dey there always.'] },
];

export function Welcome({ guideOnly, onDone }: { guideOnly?: boolean; onDone: () => void }) {
  const { s, d } = useStore();
  const L = useL();
  const [i, setI] = useState(0);
  const [step, setStep] = useState<'guide' | 'consent' | 'you' | 'baby'>('guide');
  const [ai, setAi] = useState(true);
  const [name, setName] = useState('');
  const [area, setArea] = useState('');
  const [baby, setBaby] = useState({ name: '', sex: 'female' as 'female' | 'male', dob: '' });

  const finishGuide = () => { if (guideOnly) { d({ type: 'set', patch: { guideSeen: true } }); onDone(); } else setStep('consent'); };
  const finishSetup = () => {
    d({ type: 'set', patch: { consent: { at: new Date().toISOString(), ai }, mother: { name: name.trim() || 'Mama', area: area.trim() }, baby: { name: baby.name.trim(), sex: baby.sex, dob: baby.dob }, guideSeen: true } });
    onDone();
  };
  const sl = SLIDES[i];
  const txt = s.lang === 'pcm' ? sl.pcm : sl.en;

  if (step === 'guide') return (
    <div className="plum-screen">
      <div className="row between">
        <div className="row" style={{ gap: 10 }}><Mark size={36} tone="soft" /><Wordmark size={28} color="var(--plum)" /></div>
        <div className="seg" style={{ width: 170 }}>
          <button aria-pressed={s.lang === 'en'} onClick={() => d({ type: 'set', patch: { lang: 'en' } })}>English</button>
          <button aria-pressed={s.lang === 'pcm'} onClick={() => d({ type: 'set', patch: { lang: 'pcm' } })}>Pidgin</button>
        </div>
      </div>
      <div style={{ flex: 1, minHeight: 260, display: 'grid', placeItems: 'center', position: 'relative' }} aria-hidden>
        <div style={{ position: 'absolute', width: 280, height: 280, borderRadius: '50%', border: '1px solid rgba(227,11,93,.10)' }} />
        <div style={{ position: 'absolute', width: 210, height: 210, borderRadius: '50%', border: '1px solid rgba(227,11,93,.16)' }} />
        {sl.k === 'mark' && <Mark size={200} tone="soft" />}
        {sl.k !== 'mark' && (
          <div style={{ width: 150, height: 150, borderRadius: '50%', background: 'var(--plum-soft)', display: 'grid', placeItems: 'center', color: 'var(--rose)' }}>
            <Icon n={sl.k === 'checkin' ? 'heart' : sl.k === 'circle' ? 'circle' : 'mic'} size={64} />
          </div>
        )}
      </div>
      <div className="dots" style={{ gridTemplateColumns: 'repeat(4, 1fr)', flex: 'none' }} aria-label={L(`Step ${i + 1} of 4`, `Step ${i + 1} of 4`)}>
        {SLIDES.map((_, k) => <span key={k} className={k <= i ? 'on' : ''} />)}
      </div>
      <h1 style={{ fontSize: 30, marginTop: 18, lineHeight: 1.15 }}>{txt[0]}</h1>
      <p style={{ marginTop: 12, fontSize: 16, lineHeight: 1.55, color: 'var(--ink-3)' }}>{txt[1]}</p>
      <div className="row" style={{ marginTop: 24 }}>
        {i > 0 && <button className="close" style={{ width: 52, height: 52 }} aria-label={L('Back')} onClick={() => setI(i - 1)}><Icon n="back" /></button>}
        <button className="btn white" style={{ flex: 1 }} onClick={() => (i < 3 ? setI(i + 1) : finishGuide())}>{i < 3 ? L('Next') : guideOnly ? L('Done', 'Finish') : L('Get started', 'Make we start')}</button>
      </div>
      {!guideOnly && i === 0 && <button className="btn" style={{ marginTop: 10, background: 'transparent', color: 'var(--plum)' }} onClick={() => { d({ type: 'replace', state: demoState(s.lang) }); onDone(); }}>{L('Explore with example data', 'Check am with example data')}</button>}
      {i > 0 && <button className="btn" style={{ marginTop: 10, background: 'transparent', color: 'var(--ink-3)', minHeight: 44 }} onClick={finishGuide}>{L('Skip')}</button>}
    </div>
  );

  const Head = ({ n, back }: { n: number; back: () => void }) => (
    <div className="row" style={{ marginBottom: 22 }}>
      <button className="ghost-round" aria-label={L('Back')} onClick={back}><Icon n="back" /></button>
      <div className="bar" style={{ flex: 1 }}><span style={{ width: `${(n / 3) * 100}%` }} /></div>
      <span className="xs muted">{n}/3</span>
    </div>
  );

  return (
    <main className="page" style={{ paddingBottom: 40 }}>
      {step === 'consent' && (
        <>
          <Head n={1} back={() => setStep('guide')} />
          <div className="icon-sq t-sage" style={{ width: 56, height: 56, borderRadius: 18, color: 'var(--sage-ink)' }}><Icon n="heart" /></div>
          <h1 style={{ marginTop: 14 }}>{L('Your information stays private', 'Your information go stay private')}</h1>
          <p className="muted" style={{ marginTop: 10 }}>{L('What you share is saved only on this phone. You can delete everything at any time.', 'Wetin you share go stay only for this phone. You fit delete everything anytime.')}</p>
          <label className="check" style={{ marginTop: 16 }}><input type="checkbox" checked={ai} onChange={(e) => setAi(e.target.checked)} /><span>{L('Use AI for Dr SweetMom answers. Only your question is sent, never your name.', 'Use AI for Dr SweetMom answer. Na only your question dem go send, no be your name.')}</span></label>
          <p className="note plum mt16">{L('SweetMom does not replace your clinic. In an emergency, go to hospital.', 'SweetMom no dey replace your clinic. If emergency, go hospital.')}</p>
          <button className="btn block mt16" onClick={() => setStep('you')}>{L('I agree')}</button>
        </>
      )}
      {step === 'you' && (
        <>
          <Head n={2} back={() => setStep('consent')} />
          <h1>{L('About you', 'About you')}</h1>
          <label className="field" htmlFor="nm">{L('Your first name', 'Your first name')}</label>
          <input id="nm" type="text" value={name} onChange={(e) => setName(e.target.value)} autoComplete="given-name" />
          <label className="field" htmlFor="ar">{L('Your area (for your Circle)', 'Your area (for your Circle)')}</label>
          <input id="ar" type="text" placeholder={L('For example: Rumuola, Port Harcourt')} value={area} onChange={(e) => setArea(e.target.value)} />
          <button className="btn block mt16" disabled={!name.trim()} onClick={() => setStep('baby')}>{L('Next')}</button>
        </>
      )}
      {step === 'baby' && (
        <>
          <Head n={3} back={() => setStep('you')} />
          <h1>{L('About your baby', 'About your pikin')}</h1>
          <label className="field" htmlFor="bn">{L("Baby's name", 'Pikin name')}</label>
          <input id="bn" type="text" value={baby.name} onChange={(e) => setBaby({ ...baby, name: e.target.value })} />
          <label className="field">{L('Boy or girl', 'Boy or girl')}</label>
          <div className="seg">
            <button aria-pressed={baby.sex === 'female'} onClick={() => setBaby({ ...baby, sex: 'female' })}>{L('Girl')}</button>
            <button aria-pressed={baby.sex === 'male'} onClick={() => setBaby({ ...baby, sex: 'male' })}>{L('Boy')}</button>
          </div>
          <label className="field" htmlFor="bd">{L('Date of birth', 'Day wey e born')}</label>
          <input id="bd" type="date" value={baby.dob} max={todayIso()} min={addDays(todayIso(), -730)} onChange={(e) => setBaby({ ...baby, dob: e.target.value })} />
          <button className="btn block mt16" disabled={!baby.name.trim() || !baby.dob} onClick={finishSetup}>{L('Start using SweetMom', 'Start to use SweetMom')}</button>
        </>
      )}
    </main>
  );
}
