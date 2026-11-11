import { useState } from 'react';
import { useStore, useL, todayIso } from '../store';
import { Icon } from '../components';
import { EPDS_LICENSED } from '../content/epds-licensed';
import { scoreEpds } from '../engine/epds';
import { babyDays } from '../derive';

export function Epds({ onClose, onCrisis, onCheckin, onTalk }: { onClose: () => void; onCrisis: () => void; onCheckin: () => void; onTalk: () => void }) {
  const { s, d } = useStore();
  const L = useL();
  const [i, setI] = useState(0);
  const [ans, setAns] = useState<Record<number, number>>({});
  const [res, setRes] = useState<ReturnType<typeof scoreEpds> | null>(null);

  if (!EPDS_LICENSED) return (
    <div className="plum-screen">
      <div className="row between"><span /><button className="close" aria-label={L('Close')} onClick={onClose}><Icon n="x" /></button></div>
      <div className="tag-pill" style={{ marginTop: 28 }}><Icon n="sparkle" />{L('Wellbeing screen')}</div>
      <h1 style={{ marginTop: 14, color: 'var(--ink)' }}>{L('Coming soon', 'E dey come soon')}</h1>
      <p style={{ marginTop: 12, lineHeight: 1.55, color: 'var(--ink-3)' }}>{L('SweetMom will use the Edinburgh Postnatal Depression Scale, a 10-question screen trusted by clinicians worldwide, at 2 and 6 weeks and then every few months. We are waiting for permission to include it.', 'SweetMom go use Edinburgh Postnatal Depression Scale, 10 question wey doctors trust worldwide, for 2 and 6 weeks then every few months. We dey wait for permission to put am.')}</p>
      <p style={{ marginTop: 12, lineHeight: 1.55, color: 'var(--ink-3)' }}>{L('Until then, the weekly check-in helps us notice when you need more support.', 'Till then, the weekly check-in go help us see when you need more support.')}</p>
      <div style={{ flex: 1 }} />
      <button className="btn white block" onClick={() => { onClose(); onCheckin(); }}>{L('Do the weekly check-in')}</button>
    </div>
  );

  const items = EPDS_LICENSED.items;
  const it = items[i];
  const finish = () => {
    const r = scoreEpds(ans);
    d({ type: 'epds', r: { date: todayIso(), babyDay: babyDays(s), total: r.total, band: r.band, selfHarm: r.selfHarm } });
    if (r.selfHarm) { onCrisis(); return; }
    setRes(r);
  };
  if (res) return (
    <div className="plum-screen">
      <div className="row between"><span /><button className="close" aria-label={L('Close')} onClick={onClose}><Icon n="x" /></button></div>
      <h1 style={{ marginTop: 28, color: 'var(--ink)' }}>{L('Thank you, mama.', 'Thank you, mama.')}</h1>
      <p style={{ marginTop: 12, lineHeight: 1.55, color: 'var(--ink-3)' }}>{res.band === 'likely'
        ? L('Your answers suggest you may be going through postnatal depression. This is common and treatable. Please talk to a health worker this week. Your Supermom will also reach out to you.', 'Your answer show say postnatal depression fit dey worry you. E common and e dey treat. Abeg talk to health worker this week. Your Supermom go reach you too.')
        : res.band === 'possible' ? L('Some of your answers suggest you are under strain. Let us check again in two weeks, and please lean on your Supermom and Circle.', 'Some of your answer show say pressure dey. Make we check again in two weeks, and lean on your Supermom and Circle.')
        : L('Your answers do not suggest depression right now. Keep checking in, and reach out any time things feel heavy.', 'Your answer no show depression now. Continue to check in, and reach out anytime wey e heavy.')}</p>
      <div style={{ flex: 1 }} />
      {res.band !== 'low' && <button className="btn blush block" onClick={() => { onClose(); onTalk(); }}>{L('Talk to someone now')}</button>}
      <button className="btn white block mt8" onClick={onClose}>{L('Done')}</button>
    </div>
  );
  return (
    <div className="plum-screen">
      <div className="row">
        <button className="close" aria-label={L('Close')} onClick={onClose}><Icon n="x" /></button>
        <div className="dots" style={{ gridTemplateColumns: `repeat(${items.length}, 1fr)` }}>{items.map((_, k) => <span key={k} className={k <= i ? 'on' : ''} />)}</div>
      </div>
      {i === 0 && <p className="sm" style={{ marginTop: 18, color: 'var(--ink-3)' }}>{EPDS_LICENSED.intro}</p>}
      <h1 style={{ marginTop: 18, color: 'var(--ink)', fontSize: 28 }}>{it.text}</h1>
      <div style={{ display: 'grid', gap: 10, marginTop: 18 }}>{it.options.map((o, k) => <button key={k} className="answer" aria-pressed={ans[it.n] === k} onClick={() => setAns({ ...ans, [it.n]: k })}>{o}</button>)}</div>
      <div style={{ flex: 1 }} />
      <p className="xs" style={{ color: 'var(--ink-3)', marginBottom: 8 }}>© 1987 The Royal College of Psychiatrists. Cox, Holden and Sagovsky (1987), British Journal of Psychiatry 150:782-786.</p>
      <button className="btn blush block" disabled={ans[it.n] == null} onClick={() => (i < items.length - 1 ? setI(i + 1) : finish())}>{i < items.length - 1 ? L('Next') : L('Finish')}</button>
    </div>
  );
}
