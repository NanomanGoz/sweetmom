import { useState } from 'react';
import { useStore, useL, uid, todayIso, addDays } from '../store';
import { Icon, HelpPill, GrowthChart, Sheet } from '../components';
import { ageLabel, babyMonths, growthStatus, vaccinePlan, vaccineIcs, saveFile } from '../derive';
import { milestoneBand, visitTitle } from '../content/firstyear';
import { MEALS } from '../engine/data';
import { ageInMonths } from '../engine/clinical';
import { FOOD_GROUPS } from '../engine/data';

const REASON: Record<string, [string, string]> = {
  growth_low: ['Weight is low for age or length. Please see your clinic soon.', 'Weight low for im age. Abeg go clinic soon.'],
  growth_very_low: ['Weight is very low. Please go to your clinic today.', 'Weight low well well. Abeg go clinic today.'],
  growth_short: ['Length is short for age. Ask at your next clinic visit.', 'E short for im age. Ask for your next clinic visit.'],
  growth_high: ['Weight is high for length. Ask at your next clinic visit.', 'Weight high for im length. Ask for next clinic visit.'],
  growth_faltering: ['No weight gain since last time. Please see your clinic soon.', 'E never add weight since last time. Abeg go clinic soon.'],
};
const fmt = (iso: string) => new Date(iso + 'T12:00:00').toLocaleDateString(undefined, { day: 'numeric', month: 'short' });

export function Baby({ onHelp, initialTab }: { onHelp: () => void; initialTab?: 'week' | 'vaccines' }) {
  const { s, d } = useStore();
  const L = useL();
  const [tab, setTab] = useState<'week' | 'feeding' | 'growth' | 'vaccines'>(initialTab ?? 'week');
  const [adding, setAdding] = useState(false);
  const [w, setW] = useState(''); const [len, setLen] = useState(''); const [date, setDate] = useState(todayIso());
  const [err, setErr] = useState('');
  if (!s.baby) return <main className="page"><h1>{L('Baby')}</h1></main>;
  const b = s.baby;
  const months = babyMonths(s);
  const band = milestoneBand(months);
  const g = growthStatus(s);
  const points = s.growth.filter((x) => x.weightKg != null).map((x) => ({ x: ageInMonths(b.dob, x.date), y: x.weightKg! })).filter((p) => p.x >= 0 && p.x <= 12);
  const today = todayIso();
  const fed = s.feeding.find((f) => f.date === today);
  const yday = s.feeding.find((f) => f.date === addDays(today, -1));
  const plan = vaccinePlan(s);
  const [giving, setGiving] = useState<string | null>(null);
  const [givenDate, setGivenDate] = useState(todayIso());

  const save = () => {
    const wk = Number(w), lc = len ? Number(len) : undefined;
    if (!(wk > 1 && wk < 20) || (lc != null && !(lc > 40 && lc < 100))) { setErr(L('These numbers look unusual. Please check the clinic card.', 'These numbers no look normal. Abeg check clinic card.')); return; }
    d({ type: 'growth', g: { id: uid(), date, weightKg: wk, lengthCm: lc } }); setAdding(false); setW(''); setLen(''); setErr('');
  };

  const Status = (
    <div className="tile row" style={{ background: g.flags.length ? 'var(--amber-soft)' : 'var(--sage)', gap: 14, padding: '16px 18px' }}>
      <div style={{ flex: 1 }}>
        <div className="eyebrow" style={{ color: g.flags.length ? 'var(--amber-ink)' : 'var(--sage-ink)' }}>{L('Growth')}</div>
        <div style={{ fontSize: 20, fontWeight: 800, marginTop: 2 }}>{g.latest ? (g.flags.length ? L('Please check with clinic', 'Abeg check with clinic') : L('Growing well', 'E dey grow well')) : L('No weight yet', 'No weight yet')}</div>
        <div className="sm" style={{ marginTop: 2, color: 'var(--ink-2)' }}>
          {g.latest ? (g.flags.length ? g.flags.map((f) => (s.lang === 'pcm' ? REASON[f.id]?.[1] : REASON[f.id]?.[0]) ?? '').join(' ') : L(`${g.latest.weightKg} kg, weighed ${g.agoDays === 0 ? 'today' : `${g.agoDays} days ago`}`, `${g.latest.weightKg} kg, weigh am ${g.agoDays === 0 ? 'today' : `${g.agoDays} days ago`}`)) : L('Add a weight from the clinic card.', 'Add weight from clinic card.')}
        </div>
      </div>
      <button className="btn sm" onClick={() => setAdding(true)}>{L('Add weight')}</button>
    </div>
  );

  const nextIdx = plan.findIndex((v) => v.status !== 'done');

  return (
    <main className="page">
      <div className="head">
        <div className="avatar av-baby" style={{ width: 48, height: 48 }} aria-hidden>{b.name.slice(0, 1).toUpperCase()}</div>
        <div style={{ flex: 1, lineHeight: 1.25 }}>
          <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em' }}>{b.name}</div>
          <div className="sm muted">{ageLabel(s, L)}</div>
        </div>
        <HelpPill onClick={onHelp} />
      </div>
      <div className="chips mt12" role="tablist" style={{ flexWrap: 'nowrap', overflowX: 'auto' }}>
        {([['week', L('This week')], ['feeding', L('Feeding')], ['growth', L('Growth')], ['vaccines', L('Vaccines', 'Vaccine')]] as const).map(([id, lab]) => (
          <button key={id} role="tab" className="chip-btn" aria-pressed={tab === id} aria-selected={tab === id} onClick={() => setTab(id)}>{lab}</button>
        ))}
      </div>

      {tab === 'week' && (
        <>
          <div className="mt12">{Status}</div>
          <section className="card mt12">
            <div className="row between"><div style={{ fontWeight: 800 }}>{s.lang === 'pcm' ? band.label.pcm : band.label.en}</div><span className="xs muted" style={{ fontWeight: 700 }}>{band.items.filter((x) => s.milestones[x.id]).length} {L('of')} {band.items.length} {L('seen', 'don see')}</span></div>
            <div className="mt8">
              {band.items.map((m) => (
                <label key={m.id} className="check"><input type="checkbox" checked={!!s.milestones[m.id]} onChange={() => d({ type: 'toggleMilestone', id: m.id })} />{s.lang === 'pcm' ? m.t.pcm : m.t.en}</label>
              ))}
            </div>
            <div className="note plum mt8"><strong>{L('Play this week', 'Play this week')}: </strong>{s.lang === 'pcm' ? band.play.pcm : band.play.en}</div>
            <p className="xs muted mt8">{L(`Every baby grows at their own pace. If you are worried, ask Dr SweetMom or your clinic.`, 'Every pikin dey grow for im own pace. If e dey worry you, ask Dr SweetMom or clinic.')}</p>
          </section>
          <button className="card mt12" style={{ width: '100%', textAlign: 'left' }} onClick={() => setTab('vaccines')}>
            <div className="row between"><div style={{ fontWeight: 800 }}>{L('Vaccines', 'Vaccine')}</div><span className="muted"><Icon n="chevron" size={18} /></span></div>
            <div className="timeline">
              {plan.slice(Math.max(0, nextIdx - 2), Math.max(0, nextIdx - 2) + 4).map((v) => {
                const isDone = v.status === 'done'; const isNext = plan[nextIdx]?.id === v.id;
                return (
                  <div key={v.id} className="step">
                    <div className="dot" style={isDone ? { background: 'var(--sage-ink)', color: '#fff' } : { border: `${isNext ? 3 : 2}px solid ${v.status === 'overdue' ? 'var(--danger)' : isNext ? 'var(--plum)' : 'var(--line)'}`, background: 'var(--surface)' }}>{isDone && <Icon n="check" />}</div>
                    <div className="xs" style={{ fontWeight: isNext ? 800 : 700, marginTop: 6 }}>{s.lang === 'pcm' ? v.label.pcm : v.label.en}</div>
                    {isNext && <div className="xs" style={{ color: v.status === 'overdue' ? 'var(--danger-text)' : 'var(--ink-3)', fontWeight: v.status === 'overdue' ? 800 : 500 }}>{v.status === 'overdue' ? L('Overdue', 'E don pass') : v.inDays > 0 ? L(`In ${v.inDays} days`, `Remain ${v.inDays} days`) : L('Due now', 'E don reach')}</div>}
                  </div>
                );
              })}
            </div>
          </button>
        </>
      )}

      {tab === 'feeding' && (
        <section className="card mt12">
          {months < 6 ? (
            <>
              <div style={{ fontWeight: 800 }}>{L('Breast milk only until 6 months', 'Only breast milk until 6 months')}</div>
              <p className="sm muted mt8">{L('No water, glucose, pap or herbal drinks are needed, even in hot weather. Feed whenever baby wants, at least 8 times a day.', 'Pikin no need water, glucose, pap or agbo, even when weather hot. Feed am anytime e want, at least 8 times every day.')}</p>
              <div style={{ fontWeight: 700, marginTop: 14 }}>{L(`Yesterday, did ${b.name} have anything other than breast milk?`, `Yesterday, ${b.name} take anything apart from breast milk?`)}</div>
              <div className="seg mt8">
                <button aria-pressed={!!yday && yday.other.length === 0} onClick={() => d({ type: 'feeding', f: { date: addDays(today, -1), breastmilk: true, other: [], groups: [] } })}>{L('No, only breast milk', 'No, only breast milk')}</button>
                <button aria-pressed={!!yday && yday.other.length > 0} onClick={() => d({ type: 'feeding', f: { date: addDays(today, -1), breastmilk: true, other: ['water'], groups: [] } })}>{L('Yes')}</button>
              </div>
              {yday && <p className={`note mt12 ${yday.other.length ? 'amber' : 'sage'}`}>{yday.other.length ? L('Try to give breast milk only. Ask Dr SweetMom if you are worried about milk supply.', 'Try give only breast milk. Ask Dr SweetMom if milk no dey reach.') : L('Perfect. Breast milk gives your baby everything right now.', 'Perfect. Breast milk dey give am everything e need now.')}</p>}
            </>
          ) : (
            <>
              <div style={{ fontWeight: 800 }}>{L(`What did ${b.name} eat today?`, `Wetin ${b.name} chop today?`)}</div>
              <p className="xs muted">{L('Tap each kind of food. Aim for 5 of these 8 every day.', 'Touch every kind of food. Try reach 5 of these 8 every day.')}</p>
              <div className="chips mt12">
                {FOOD_GROUPS.child.groups.map((gr) => {
                  const on = !!fed?.groups.includes(gr.id);
                  return <button key={gr.id} className="chip-btn" aria-pressed={on} onClick={() => d({ type: 'feeding', f: { date: today, breastmilk: true, other: [], groups: on ? (fed?.groups ?? []).filter((x) => x !== gr.id) : [...(fed?.groups ?? []), gr.id] } })}>{gr.local}</button>;
                })}
              </div>
              <p className={`note mt12 ${(fed?.groups.length ?? 0) >= 5 ? 'sage' : 'plum'}`}>{(fed?.groups.length ?? 0) >= 5 ? L('Great variety today.', 'Better mix today.') : L(`${fed?.groups.length ?? 0} of 5 so far. Try adding an egg, fish, beans or pawpaw.`, `${fed?.groups.length ?? 0} of 5 so far. Try add egg, fish, beans or pawpaw.`)}</p>
            </>
          )}
        </section>
      )}

      {tab === 'growth' && (
        <>
          <div className="mt12">{Status}</div>
          {points.length > 0 && <section className="card mt12"><div style={{ fontWeight: 800, marginBottom: 8 }}>{L('Weight for age')}</div><GrowthChart sex={b.sex} points={points} /></section>}
        </>
      )}

      {tab === 'vaccines' && (
        <>
          <section className="tile t-plum mt12">
            <div className="row between">
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800 }}>{L('Reminders', 'Reminder')}</div>
                <div className="xs muted">{L('We remind you here a week before each visit. Add them to your phone calendar for an alert the day before.', 'We go remind you here one week before every visit. Add am to your phone calendar make e alert you the day before.')}</div>
              </div>
              <label className="row" style={{ gap: 6 }}><input type="checkbox" checked={s.reminders} onChange={(e) => d({ type: 'set', patch: { reminders: e.target.checked } })} style={{ width: 22, height: 22, accentColor: 'var(--plum)' }} /><span className="sr">{L('Reminders on')}</span></label>
            </div>
            <button className="btn sm mt12" onClick={() => saveFile(`${b.name}-vaccines.ics`, vaccineIcs(s), 'text/calendar')}><Icon n="calendar" size={18} />{L('Add all to my phone calendar', 'Add all to my phone calendar')}</button>
          </section>
          {plan.map((v) => (
            <section key={v.id} className="card mt12" style={v.status === 'overdue' ? { borderColor: 'var(--danger)' } : v.status === 'due' ? { borderColor: 'var(--plum)' } : undefined}>
              <div className="row between">
                <div>
                  <div style={{ fontWeight: 800 }}>{visitTitle(v, s.lang)}</div>
                  <div className="xs muted">{L('Due', 'Due')} {fmt(v.dueDate)}</div>
                </div>
                <span className={`badge ${v.status === 'done' ? 'b-sage' : v.status === 'overdue' ? 'b-danger' : v.status === 'due' ? 'b-plum' : 'b-amber'}`}>
                  {v.status === 'done' ? L('Given', 'Don give') : v.status === 'overdue' ? L('Overdue', 'E don pass') : v.status === 'due' ? (v.inDays > 0 ? L(`In ${v.inDays} days`, `Remain ${v.inDays} days`) : L('Due now', 'E don reach')) : v.status === 'soon' ? L(`In ${v.inDays} days`, `Remain ${v.inDays} days`) : L('Later')}
                </span>
              </div>
              <div className="chips mt8">{v.doses.map((x) => <span key={x} className="badge" style={{ background: 'var(--sunk)', color: 'var(--ink-2)', fontWeight: 700 }}>{x}</span>)}</div>
              {v.status === 'done'
                ? <div className="row between mt12"><span className="xs" style={{ color: 'var(--sage-ink)', fontWeight: 700 }}>✓ {v.givenOn ? L(`Given ${fmt(v.givenOn)}`, `Dem give am ${fmt(v.givenOn)}`) : L('Given')}</span><button className="link" onClick={() => d({ type: 'vaccine', id: v.id, date: null })}>{L('Undo')}</button></div>
                : <button className="btn sm soft mt12" onClick={() => { setGivenDate(v.inDays > 0 ? todayIso() : v.dueDate > todayIso() ? todayIso() : v.dueDate); setGiving(v.id); }}>{L('Mark as given', 'Mark say dem don give am')}</button>}
              {v.status === 'overdue' && <p className="note danger mt12">{L('This visit is late. Vaccines still work when given late, so please go to your clinic as soon as you can.', 'This visit don late. Vaccine still dey work even if e late, abeg go clinic as soon as you fit.')}</p>}
            </section>
          ))}
          <p className="xs muted mt12">{L('Based on the Nigeria routine immunisation schedule. Always follow the dates on your clinic card.', 'E follow Nigeria routine immunisation schedule. Always follow the date for your clinic card.')}</p>
        </>
      )}

      {tab === 'feeding' && months >= 6 && (
        <>
          <h2>{L('Recipes to try', 'Recipe to try')}</h2>
          {MEALS.filter((m) => m.audience === 'infant').map((m) => (
            <div key={m.id} className="card mt8" style={{ padding: '12px 16px' }}>
              <div style={{ fontWeight: 800 }}>{m.names.en}</div>
              <div className="xs muted">{m.portionHint}</div>
            </div>
          ))}
        </>
      )}

      {giving && (
        <Sheet title={L('Mark as given', 'Mark say dem don give am')} onClose={() => setGiving(null)}>
          <label className="field" htmlFor="gd">{L('Date given', 'Day wey dem give am')}</label>
          <input id="gd" type="date" value={givenDate} min={b.dob} max={todayIso()} onChange={(e) => setGivenDate(e.target.value)} />
          <button className="btn block mt16" onClick={() => { d({ type: 'vaccine', id: giving, date: givenDate }); setGiving(null); }}>{L('Save')}</button>
        </Sheet>
      )}

      {adding && (
        <Sheet title={L('Add weight', 'Add weight')} onClose={() => setAdding(false)}>
          <div className="grid2">
            <div><label className="field" htmlFor="wk">{L('Weight (kg)')}</label><input id="wk" type="number" inputMode="decimal" step="0.1" value={w} onChange={(e) => setW(e.target.value)} /></div>
            <div><label className="field" htmlFor="lc">{L('Length (cm), optional')}</label><input id="lc" type="number" inputMode="decimal" step="0.5" value={len} onChange={(e) => setLen(e.target.value)} /></div>
          </div>
          <label className="field" htmlFor="wd">{L('Date measured', 'Day wey dem measure')}</label>
          <input id="wd" type="date" value={date} min={b.dob} max={today} onChange={(e) => setDate(e.target.value)} />
          {err && <p className="note amber mt12">{err}</p>}
          <button className="btn block mt16" disabled={!w} onClick={save}>{L('Save')}</button>
        </Sheet>
      )}
    </main>
  );
}
