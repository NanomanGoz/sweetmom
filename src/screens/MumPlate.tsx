import { useStore, useL, todayIso } from '../store';
import { MUM_GROUPS, MUM_ADD_ORDER } from '../content/firstyear';

/** Mum's plate: tap the kinds of food eaten today. Aim for 5 of 10 (FAO MDD-W). */
export function MumPlate({ compact }: { compact?: boolean }) {
  const { s, d } = useStore();
  const L = useL();
  const today = todayIso();
  const groups = s.mumFood.find((f) => f.date === today)?.groups ?? [];
  const n = Math.min(groups.length, 5);
  const next = MUM_ADD_ORDER.find((id) => !groups.includes(id));
  const nextName = MUM_GROUPS.find((g) => g.id === next);
  const toggle = (id: string) => d({ type: 'mumFood', date: today, groups: groups.includes(id) ? groups.filter((x) => x !== id) : [...groups, id] });
  return (
    <div>
      <div className="row between">
        <div>
          <div style={{ fontWeight: 800 }}>{L('Your plate today', 'Your plate today')}</div>
          <div className="xs muted">{L('Breastfeeding takes extra food and water. Aim for 5 kinds of food a day.', 'Breastfeeding need extra food and water. Try chop 5 kind of food every day.')}</div>
        </div>
        <div className="serif" style={{ fontSize: 34, lineHeight: 1, color: 'var(--plum)' }}>{n}<span style={{ fontSize: 18, color: 'var(--ink-3)' }}>/5</span></div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 5, marginTop: 10 }} aria-hidden>
        {[0, 1, 2, 3, 4].map((i) => <span key={i} style={{ height: 8, borderRadius: 999, background: i < n ? 'var(--sage-ink)' : 'var(--sunk)' }} />)}
      </div>
      <div className="chips mt12">
        {(compact ? MUM_GROUPS.filter((g) => groups.includes(g.id) || MUM_ADD_ORDER.slice(0, 6).includes(g.id)) : MUM_GROUPS).map((g) => (
          <button key={g.id} className="chip-btn" aria-pressed={groups.includes(g.id)} title={s.lang === 'pcm' ? g.ex.pcm : g.ex.en} onClick={() => toggle(g.id)}>{s.lang === 'pcm' ? g.name.pcm : g.name.en}</button>
        ))}
      </div>
      {groups.length >= 5
        ? <p className="note sage mt12">{L('Well done. Good variety today for you and your milk.', 'Well done. Better mix today for you and your breast milk.')}</p>
        : nextName && <p className="note plum mt12"><strong>{L('Next, add', 'Next, add')} {(s.lang === 'pcm' ? nextName.name.pcm : nextName.name.en).toLowerCase()}:</strong> {s.lang === 'pcm' ? nextName.ex.pcm : nextName.ex.en}.</p>}
    </div>
  );
}
