import { useStore, useL } from '../store';
import { Icon } from '../components';
import { STAGES, stageFor } from '../content/journey';
import { babyDays } from '../derive';
import type { Go } from './Home';

export function Journey({ onClose, go }: { onClose: () => void; go: Go }) {
  const { s } = useStore();
  const L = useL();
  const day = babyDays(s);
  const cur = stageFor(day);
  const tx = (x: { en: string; pcm: string }) => (s.lang === 'pcm' ? x.pcm : x.en);
  return (
    <main className="page" style={{ paddingBottom: 40 }}>
      <div className="head">
        <button className="ghost-round" aria-label={L('Back')} onClick={onClose}><Icon n="back" /></button>
        <h1 style={{ flex: 1 }}>{L('Your first year', 'Your first year')}</h1>
      </div>
      <p className="muted mt8">{L('Every stage has its own hard parts. Here is what to expect, and how SweetMom walks with you through each one.', 'Every stage get im own hard part. See wetin to expect, and how SweetMom dey waka with you for each one.')}</p>
      <div style={{ position: 'relative', marginTop: 18 }}>
        <div style={{ position: 'absolute', left: 11, top: 8, bottom: 8, width: 2, background: 'var(--line)' }} aria-hidden />
        {STAGES.map((st) => {
          const isCur = st.id === cur.id; const past = st.toDay < day;
          return (
            <section key={st.id} style={{ position: 'relative', paddingLeft: 36, marginBottom: 14 }}>
              <span aria-hidden style={{ position: 'absolute', left: 4, top: 18, width: 16, height: 16, borderRadius: '50%', background: past ? 'var(--sage-ink)' : isCur ? 'var(--plum)' : 'var(--surface)', border: `2px solid ${past ? 'var(--sage-ink)' : 'var(--plum)'}` }} />
              <div className="card" style={isCur ? { borderColor: 'var(--plum)', boxShadow: 'var(--shadow)' } : undefined}>
                <div className="row between">
                  <div className="xs muted" style={{ fontWeight: 700 }}>{st.fromDay === 0 ? L('Days 0 to 7') : L(`Weeks ${Math.round(st.fromDay / 7)} to ${Math.round(st.toDay / 7)}`)}</div>
                  {isCur && <span className="badge b-plum">{L('You are here', 'You dey here')}</span>}
                </div>
                <div className="serif" style={{ fontSize: 24, marginTop: 2 }}>{tx(st.name)}</div>
                <p className="sm" style={{ color: 'var(--ink-2)', marginTop: 4 }}>{tx(st.tagline)}</p>
                {(isCur || !past) && (
                  <>
                    <div className="eyebrow mt12" style={{ color: 'var(--rose)' }}>{L('Where mums struggle', 'Where mama dey struggle')}</div>
                    <ul style={{ margin: '6px 0 0', paddingLeft: 18, fontSize: 14.5, lineHeight: 1.5 }}>{st.struggles.map((x) => <li key={x.en}>{tx(x)}</li>)}</ul>
                    <div className="eyebrow mt12" style={{ color: 'var(--danger-text)' }}>{L('Watch for', 'Watch out for')}</div>
                    <ul style={{ margin: '6px 0 0', paddingLeft: 18, fontSize: 14.5, lineHeight: 1.5 }}>{st.risks.map((x) => <li key={x.en}>{tx(x)}</li>)}</ul>
                    <div className="eyebrow mt12" style={{ color: 'var(--sage-ink)' }}>{L('How SweetMom helps', 'How SweetMom dey help')}</div>
                    <div className="chips mt8">{st.actions.map((a) => <button key={a.label.en} className="chip-btn" onClick={() => go(a.to === 'learn' ? `article:${st.learn[0]}` : a.to === 'baby' ? 'baby' : a.to)}>{tx(a.label)}</button>)}</div>
                  </>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}
