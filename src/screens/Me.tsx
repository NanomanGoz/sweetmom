import { useState } from 'react';
import { useStore, useL } from '../store';
import { Icon, HelpPill, Mark, Sheet } from '../components';
import { babyWeeks, lastCheckin, demoState, saveFile } from '../derive';
import type { Go } from './Home';
import { CONTACTS, waLink } from '../config/contacts';
import { MumPlate } from './MumPlate';
import { useViewer } from '../platform';
import { todayIso, addDays } from '../store';

const SLEEP = ['Less than 3 hours', '3 to 5 hours', '5 to 7 hours', 'More than 7 hours'];

export function Me({ go, onHelp, onCheckin, onGuide, onTeam }: { go: Go; onHelp: () => void; onCheckin: () => void; onGuide: () => void; onTeam: () => void }) {
  const { me } = useViewer();
  const { s, d } = useStore();
  const L = useL();
  const [settings, setSettings] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [profile, setProfile] = useState(false);
  const [pf, setPf] = useState({ name: s.mother?.name ?? '', area: s.mother?.area ?? '', bname: s.baby?.name ?? '', sex: s.baby?.sex ?? 'female', dob: s.baby?.dob ?? '' });
  const openProfile = () => { setPf({ name: s.mother?.name ?? '', area: s.mother?.area ?? '', bname: s.baby?.name ?? '', sex: s.baby?.sex ?? 'female', dob: s.baby?.dob ?? '' }); setSettings(false); setProfile(true); };
  const cs = s.checkins.slice(-6);
  const last = lastCheckin(s);
  const W = 320, H = 90;
  const pts = cs.map((c, i) => ({ x: cs.length > 1 ? 10 + (i * (W - 20)) / (cs.length - 1) : W / 2, y: 14 + (c.moodScore / 6) * (H - 28) }));
  const path = pts.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const trend = cs.length > 1 ? cs[cs.length - 1].moodScore - cs[cs.length - 2].moodScore : 0;

  const summary = () => {
    const lines = [`SweetMom summary for ${s.mother?.name ?? ''} and ${s.baby?.name ?? ''} (born ${s.baby?.dob ?? ''})`, `Printed ${new Date().toLocaleDateString()}`, '',
      'MOTHER', ...s.checkins.slice(-4).map((c) => `${c.date}: mood score ${c.moodScore}/6${c.flags.length ? ` (${c.flags.join(', ')})` : ''}`),
      ...s.epds.map((e) => `${e.date}: EPDS total ${e.total} (${e.band})`), `6-week check: ${s.postnatalCheck}`, '',
      'BABY', ...s.growth.map((g) => `${g.date}: ${g.weightKg ?? '-'} kg${g.lengthCm ? `, ${g.lengthCm} cm` : ''}`),
      `Vaccines given: ${Object.entries(s.vaccines).map(([k, v]) => `${k}${typeof v === 'string' ? ` on ${v}` : ''}`).join('; ') || 'none recorded'}`, '',
      'This summary is from the SweetMom app and is not a medical record.'];
    return lines.join('\n');
  };
  const exportData = () => saveFile('sweetmom-my-data.json', JSON.stringify(s, null, 1), 'application/json');

  return (
    <main className="page">
      <div className="head between">
        <div><h1>{L('Me')}</h1><div className="sm muted">{L(`${babyWeeks(s)} weeks since birth`, `${babyWeeks(s)} weeks since you born`)}</div></div>
        <div className="row" style={{ gap: 8 }}>
          <HelpPill onClick={onHelp} />
          <button className="q-btn" aria-label={L('Settings')} onClick={() => setSettings(true)}><Icon n="gear" size={18} /></button>
        </div>
      </div>

      {(me?.isOwner || me?.canEdit) && (
        <button className="card mt16 row" style={{ width: '100%', textAlign: 'left', borderColor: 'var(--plum)' }} onClick={onTeam}>
          <span className="icon-sq" style={{ background: 'var(--plum)', color: '#fff' }}><Icon n="doctor" size={20} /></span>
          <div style={{ flex: 1 }}><div style={{ fontWeight: 800 }}>SweetMom Team</div><div className="xs muted">Doctor inbox, Circles and photos. Only you see this.</div></div>
          <Icon n="chevron" size={18} />
        </button>
      )}

      <button className="card mt16 row" style={{ width: '100%', textAlign: 'left' }} onClick={openProfile}>
        <span className="avatar av-mum" aria-hidden>{(s.mother?.name ?? 'M').slice(0, 1).toUpperCase()}</span>
        <span className="avatar av-baby" style={{ marginLeft: -18, border: '3px solid var(--surface)' }} aria-hidden>{(s.baby?.name ?? 'B').slice(0, 1).toUpperCase()}</span>
        <div style={{ flex: 1 }}><div style={{ fontWeight: 800 }}>{s.mother?.name} &amp; {s.baby?.name}</div><div className="xs muted">{s.mother?.area || L('Add your area')}</div></div>
        <span className="link" style={{ padding: 0 }}>{L('Edit')}</span>
      </button>

      <section className="card mt12">
        <div className="row between"><div style={{ fontWeight: 800 }}>{L('How you have felt', 'How you don dey feel')}</div><span className="xs muted" style={{ fontWeight: 600 }}>{L('Weekly check-ins')}</span></div>
        {cs.length ? (
          <>
            <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={L('Mood across your recent check-ins. Higher on the chart means you felt better.')} style={{ marginTop: 10 }}>
              <text x="0" y="10" fontSize="10" fill="var(--ink-3)">{L('Better')}</text>
              <text x="0" y={H - 2} fontSize="10" fill="var(--ink-3)">{L('Harder')}</text>
              <path d={path} fill="none" stroke="var(--rose)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              {pts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={i === pts.length - 1 ? 6 : 4} fill="var(--rose)" />)}
            </svg>
            <p className="sm mt8" style={{ color: 'var(--ink-2)' }}>{last?.flags.includes('mood')
              ? L('Your last check-in shows you are carrying a lot. Please reach out to someone below.', 'Your last check-in show say plenty dey your mind. Abeg reach person below.')
              : trend < 0 ? L('This week looks lighter than last week. Keep going gently.', 'This week light pass last week. Continue small small.') : L('Keep checking in each week so we can support you.', 'Continue to check in every week so we fit support you.')}</p>
          </>
        ) : <p className="sm muted mt8">{L('Your first check-in will show here.', 'Your first check-in go show here.')}</p>}
        <button className="btn sm soft mt12" onClick={onCheckin}>{L('Check in now')}</button>
      </section>

      <div className="grid2 mt12">
        <div className="tile t-plum">
          <span style={{ color: 'var(--plum)' }}><Icon n="moon" /></span>
          <div className="xs muted mt8" style={{ fontWeight: 700 }}>{L('Sleep')}</div>
          <div style={{ fontWeight: 800 }}>{last?.answers.sleep != null ? L(SLEEP[last.answers.sleep]) : L('Not yet')}</div>
        </div>
        <button className="tile t-peach" style={{ border: 0, textAlign: 'left' }} onClick={() => d({ type: 'set', patch: { postnatalCheck: s.postnatalCheck === 'not_booked' ? 'booked' : s.postnatalCheck === 'booked' ? 'done' : 'not_booked' } })}>
          <span style={{ color: 'var(--peach-ink)' }}><Icon n="calendar" /></span>
          <div className="xs mt8" style={{ fontWeight: 700, color: 'var(--peach-ink)' }}>{L('6-week check', '6-week check')}</div>
          <div style={{ fontWeight: 800 }}>{s.postnatalCheck === 'done' ? L('Done ✓') : s.postnatalCheck === 'booked' ? L('Booked') : L('Not booked')}</div>
          <div className="xs" style={{ color: 'var(--peach-ink)' }}>{L('Tap to update', 'Touch to change')}</div>
        </button>
      </div>

      <button className="card mt12 row" style={{ width: '100%', textAlign: 'left' }} onClick={() => saveFile('sweetmom-summary.txt', summary(), 'text/plain')}>
        <span className="icon-sq t-plum" style={{ color: 'var(--plum)' }}><Icon n="calendar" size={20} /></span>
        <div style={{ flex: 1 }}><div style={{ fontWeight: 800 }}>{L('Summary for your clinic visit', 'Summary for your clinic visit')}</div><div className="xs muted">{L('Your mood, sleep and your baby\'s growth and vaccines, to show the nurse.', 'Your mood, sleep and pikin growth and vaccine, to show nurse.')}</div></div>
        <Icon n="chevron" size={18} />
      </button>

      <section className="card mt12"><MumPlate /></section>

      <h2>{L('Your support')}</h2>
      <section className="card" style={{ padding: '4px 16px' }}>
        <button className="list-row" onClick={() => go('doctor')}><span aria-hidden><Mark size={38} /></span><span className="t">{L('Talk to Dr SweetMom')}</span><Icon n="chevron" size={18} /></button>
        <button className="list-row" onClick={() => go('circle')}><span className="icon-sq" style={{ background: 'var(--blush-strong)', color: '#E30B5D', fontWeight: 800 }} aria-hidden>N</span><span className="t">{L('Message Nkechi, your Supermom', 'Message Nkechi, your Supermom')}</span><Icon n="chevron" size={18} /></button>
        {CONTACTS.whatsapp && <a className="list-row" href={waLink('Hello SweetMom')} target="_blank" rel="noopener noreferrer"><span className="icon-sq" style={{ background: '#E6F4EC', color: '#1F8F4E' }} aria-hidden><Icon n="whatsapp" size={20} /></span><span className="t">{L('Chat with SweetMom on WhatsApp')}</span><Icon n="chevron" size={18} /></a>}
        <button className="list-row" onClick={onHelp}><span className="icon-sq t-sage" style={{ color: 'var(--sage-ink)' }} aria-hidden><Icon n="chat" size={20} /></span><span className="t">{L('Speak with a counsellor')}</span><Icon n="chevron" size={18} /></button>
      </section>

      {profile && (
        <Sheet title={L('Edit profile')} onClose={() => setProfile(false)}>
          <div className="eyebrow" style={{ color: 'var(--rose)' }}>{L('You')}</div>
          <label className="field" htmlFor="pn">{L('Your first name')}</label>
          <input id="pn" type="text" value={pf.name} onChange={(e) => setPf({ ...pf, name: e.target.value })} />
          <label className="field" htmlFor="pa">{L('Your area (for your Circle)')}</label>
          <input id="pa" type="text" value={pf.area} onChange={(e) => setPf({ ...pf, area: e.target.value })} />
          <div className="eyebrow mt16" style={{ color: 'var(--sage-ink)', marginTop: 24 }}>{L('Your baby', 'Your pikin')}</div>
          <label className="field" htmlFor="pb">{L("Baby's name", 'Pikin name')}</label>
          <input id="pb" type="text" value={pf.bname} onChange={(e) => setPf({ ...pf, bname: e.target.value })} />
          <label className="field">{L('Boy or girl')}</label>
          <div className="seg">
            <button aria-pressed={pf.sex === 'female'} onClick={() => setPf({ ...pf, sex: 'female' })}>{L('Girl')}</button>
            <button aria-pressed={pf.sex === 'male'} onClick={() => setPf({ ...pf, sex: 'male' })}>{L('Boy')}</button>
          </div>
          <label className="field" htmlFor="pd">{L('Date of birth', 'Day wey e born')}</label>
          <input id="pd" type="date" value={pf.dob} max={todayIso()} min={addDays(todayIso(), -730)} onChange={(e) => setPf({ ...pf, dob: e.target.value })} />
          <p className="xs muted mt8">{L('Changing the date of birth updates vaccine dates and milestones.', 'If you change the birthday, vaccine date and milestone go change.')}</p>
          <button className="btn block mt16" disabled={!pf.name.trim() || !pf.bname.trim() || !pf.dob} onClick={() => { d({ type: 'set', patch: { mother: { name: pf.name.trim(), area: pf.area.trim() }, baby: { name: pf.bname.trim(), sex: pf.sex as 'female' | 'male', dob: pf.dob } } }); setProfile(false); }}>{L('Save changes')}</button>
        </Sheet>
      )}

      {settings && (
        <Sheet title={L('Settings')} onClose={() => setSettings(false)}>
          <label className="field">{L('Language')}</label>
          <div className="seg">
            <button aria-pressed={s.lang === 'en'} onClick={() => d({ type: 'set', patch: { lang: 'en' } })}>English</button>
            <button aria-pressed={s.lang === 'pcm'} onClick={() => d({ type: 'set', patch: { lang: 'pcm' } })}>Pidgin</button>
          </div>
          <label className="check mt12"><input type="checkbox" checked={!!s.consent?.ai} onChange={(e) => d({ type: 'set', patch: { consent: { at: s.consent?.at ?? new Date().toISOString(), ai: e.target.checked } } })} />{L('Use AI for Dr SweetMom answers (only your question is sent)')}</label>
          <div style={{ display: 'grid', gap: 10, marginTop: 16 }}>
            <button className="btn block" onClick={() => { setSettings(false); onGuide(); }}><Icon n="play" size={20} />{L('How to use SweetMom')}</button>
            <button className="btn line block" onClick={openProfile}>{L('Edit profile (you and baby)', 'Edit profile (you and pikin)')}</button>
            <button className="btn line block" onClick={exportData}>{L('Download my data')}</button>
            <button className="btn line block" onClick={() => { d({ type: 'replace', state: demoState(s.lang) }); setSettings(false); }}>{L('Load example data')}</button>
            {!confirm ? <button className="btn line block" style={{ color: 'var(--danger-text)' }} onClick={() => setConfirm(true)}>{L('Delete everything')}</button> : (
              <div className="card" style={{ background: 'var(--danger-soft)', border: 0 }}>
                <p className="sm">{L('This deletes all your information from this phone. It cannot be undone.', 'This one go delete all your information from this phone. You no fit bring am back.')}</p>
                <div className="row mt12"><button className="btn line sm" onClick={() => setConfirm(false)}>{L('Cancel')}</button><button className="btn danger sm" style={{ flex: 1 }} onClick={() => { d({ type: 'reset' }); setSettings(false); }}>{L('Yes, delete')}</button></div>
              </div>
            )}
          </div>
          <p className="xs muted mt16">{L('SweetMom v0.6. Clinical content is a draft awaiting review. SweetMom does not replace your clinic.', 'SweetMom v0.6. Clinical content na draft wey dem never review. SweetMom no dey replace your clinic.')}</p>
        </Sheet>
      )}
    </main>
  );
}
