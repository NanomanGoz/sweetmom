import { useStore, useL, todayIso } from '../store';
import { Icon, HelpPill, Photo, type Tab } from '../components';
import { babyWeeks, babyDays, checkinDue, lastCheckin, nextVaccine, growthStatus } from '../derive';
import { visitTitle } from '../content/firstyear';
import { stageFor } from '../content/journey';
import { ARTICLE_BY_ID } from '../content/learn';
import { epdsDue } from '../engine/epds';
import { CONTACTS } from '../config/contacts';
import { MumPlate } from './MumPlate';

const MOODS: [string, string][] = [['Great', 'Fine well well'], ['Okay', 'Okay'], ['Tired', 'I tire'], ['Low', 'My mind dey down'], ['Struggling', 'E hard for me']];

export type Go = (t: Tab | 'checkin' | 'epds' | 'doctor' | 'vaccines' | 'help' | 'journey' | 'whatsapp' | `article:${string}`) => void;

export function Home({ go }: { go: Go }) {
  const { s, d } = useStore();
  const L = useL();
  const today = todayIso();
  const day = babyDays(s);
  const st = stageFor(day);
  const due = checkinDue(s);
  const last = lastCheckin(s);
  const v = nextVaccine(s);
  const g = growthStatus(s);
  const bname = s.baby?.name ?? L('Baby');
  const mood = s.moods.find((m) => m.date === today)?.v;
  const lowStreak = s.moods.slice(-3).filter((m) => m.v >= 3).length >= 2 || (mood != null && mood >= 3);
  const epds = epdsDue(day, s.epds.map((e) => e.babyDay));
  const hour = new Date().getHours();
  const greet = hour < 12 ? L('Good morning') : hour < 17 ? L('Good afternoon') : L('Good evening');
  const tx = (x: { en: string; pcm: string }) => (s.lang === 'pcm' ? x.pcm : x.en);

  return (
    <main className="page" style={{ paddingBottom: 150 }}>
      <div className="head">
        <div className="avatar av-mum" aria-hidden>{(s.mother?.name ?? 'M').slice(0, 1).toUpperCase()}</div>
        <div style={{ flex: 1, lineHeight: 1.25 }}>
          <div className="xs muted" style={{ fontWeight: 600 }}>{greet}</div>
          <div style={{ fontSize: 17, fontWeight: 800 }}>{s.mother?.name}</div>
        </div>
        <HelpPill onClick={() => go('help')} />
      </div>
      {s.demo && <div className="demo">{L('Example data. Nothing here is a real person.', 'Na example data. Nobody here na real person.')}</div>}

      <section className="hero mt16">
        <svg className="deco" width="130" height="120" viewBox="0 0 130 120" aria-hidden="true"><circle cx="70" cy="46" r="46" fill="#F0457F" /><circle cx="104" cy="88" r="24" fill="#F57AA3" /></svg>
        <div className="k">{L(`Week ${babyWeeks(s)} with ${bname}`, `Week ${babyWeeks(s)} with ${bname}`)}</div>
        <div className="big">{tx(st.name)}</div>
        <p className="sm" style={{ color: '#FFFFFF', marginTop: 6, position: 'relative', maxWidth: '30ch' }}>{tx(st.tagline)}</p>
        <div className="row" style={{ marginTop: 16, position: 'relative' }}>
          <button className="btn white" style={{ flex: 1, minHeight: 48 }} onClick={() => go('checkin')}>{due ? L('Weekly check-in, 2 min', 'Weekly check-in') : L('Check in again')}</button>
          <button className="mic-round" aria-label={L('See your journey')} onClick={() => go('journey')}><Icon n="chevron" size={20} /></button>
        </div>
      </section>

      <section className="card mt12">
        <div style={{ fontWeight: 800 }}>{L('How are you today?', 'How you dey today?')}</div>
        <div className="chips mt8">
          {MOODS.map(([en, pcm], i) => <button key={en} className="chip-btn" aria-pressed={mood === i} onClick={() => d({ type: 'mood', date: today, v: i })}>{L(en, pcm)}</button>)}
        </div>
        {mood != null && (lowStreak
          ? <div className="note plum mt12"><strong>{L('Thank you for telling us.', 'Thank you as you tell us.')}</strong> {L('You do not have to carry this alone. Talk to your Supermom or Dr SweetMom today.', 'You no need carry am alone. Talk to your Supermom or Dr SweetMom today.')}
              <div className="row mt8"><button className="btn sm" onClick={() => go('circle')}>{L('My Supermom')}</button><button className="btn sm line" onClick={() => go('doctor')}>{L('Ask Dr SweetMom')}</button></div></div>
          : <p className="xs muted mt8">{L('Saved. A small check every day helps us notice when you need more support.', 'E don save. Small check every day go help us see when you need more support.')}</p>)}
      </section>

      {epds != null && (
        <button className="card mt12 row" style={{ width: '100%', textAlign: 'left', borderColor: 'var(--plum)' }} onClick={() => go('epds')}>
          <span className="icon-sq t-blush" style={{ color: 'var(--plum)' }}><Icon n="sparkle" size={20} /></span>
          <div style={{ flex: 1 }}><div style={{ fontWeight: 800 }}>{L('Your wellbeing screen is due', 'Your wellbeing check don reach')}</div><div className="xs muted">{L('10 questions about the past 7 days. Private.', '10 question about the past 7 days. Private.')}</div></div>
          <Icon n="chevron" size={18} />
        </button>
      )}

      {s.reminders && v && (v.status === 'due' || v.status === 'overdue') && (
        <button className="card mt12 row" style={{ width: '100%', textAlign: 'left', borderColor: v.status === 'overdue' ? 'var(--danger)' : 'var(--line)' }} onClick={() => go('vaccines')}>
          <span className="icon-sq" style={{ background: v.status === 'overdue' ? 'var(--danger-soft)' : 'var(--sage)', color: v.status === 'overdue' ? 'var(--danger-text)' : 'var(--sage-ink)' }}><Icon n="syringe" size={20} /></span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800 }}>{v.status === 'overdue' ? L(`${visitTitle(v, 'en')} are overdue`, `${visitTitle(v, 'pcm')} don pass`) : v.inDays > 0 ? L(`${visitTitle(v, 'en')} in ${v.inDays} days`, `${visitTitle(v, 'pcm')} remain ${v.inDays} days`) : L(`${visitTitle(v, 'en')} are due today`, `${visitTitle(v, 'pcm')} don reach today`)}</div>
            <div className="xs muted">{v.doses.join(', ')}</div>
          </div>
          <Icon n="chevron" size={18} />
        </button>
      )}

      {g.flags.length > 0 && <p className="note amber mt12">{L(`${bname}'s growth needs a clinic check. See the Baby tab.`, `${bname} growth need clinic check. Check Pikin tab.`)}</p>}
      {last?.flags.includes('mood') && !lowStreak && <p className="note plum mt12">{L('Your last check-in showed you have been carrying a lot. Your Supermom will reach out this week.', 'Your last check-in show say plenty dey your mind. Your Supermom go reach you this week.')}</p>}

      <h2>{L('At this stage, many mums find it hard to', 'For this stage, plenty mama dey find am hard to')}</h2>
      <section className="card">
        {st.struggles.slice(0, 3).map((x) => <div key={x.en} className="check" style={{ gap: 10 }}><span className="stage-dot" style={{ background: 'var(--blush-strong)' }} />{tx(x)}</div>)}
        <div className="chips mt12">
          {st.actions.map((a) => <button key={a.label.en} className="chip-btn" onClick={() => go(a.to === 'learn' ? `article:${st.learn[0]}` : a.to === 'vaccines' ? 'vaccines' : a.to === 'baby' ? 'baby' : a.to)}>{tx(a.label)}</button>)}
        </div>
      </section>

      <section className="card mt12 row" style={{ gap: 12 }}>
        <div className="avatar" style={{ background: 'var(--blush-strong)', color: 'var(--plum)' }} aria-hidden>N</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800 }}>{L('Nkechi, your Supermom', 'Nkechi, your Supermom')}</div>
          <div className="xs muted">{L(`Leads your ${s.mother?.area || 'local'} Circle. Meetup on Saturday.`, `She dey lead your ${s.mother?.area || 'local'} Circle. Meetup on Saturday.`)}</div>
        </div>
        <button className="btn sm" onClick={() => go(CONTACTS.circleGroup ? 'whatsapp' : 'circle')}>{L('Say hello')}</button>
      </section>

      <section className="card mt12"><MumPlate compact /></section>

      <h2>{L('Read for this stage', 'Read for this stage')}</h2>
      <div className="grid2">
        {st.learn.slice(0, 2).map((id) => ARTICLE_BY_ID[id]).filter(Boolean).map((a) => (
          <button key={a.id} className="card photo-card" style={{ textAlign: 'left' }} onClick={() => go(`article:${a.id}`)}>
            <Photo id={`learn-${a.id}`} h={92} radius={0} label={a.title} />
            <div className="pad"><div className="sm" style={{ fontWeight: 800, lineHeight: 1.3 }}>{a.title}</div><div className="xs muted mt8">{a.minutes} min</div></div>
          </button>
        ))}
      </div>
      <p className="serif" style={{ textAlign: 'center', fontSize: 20, color: 'var(--rose)', marginTop: 28 }}>{L('No mother goes through the first year alone.', 'No mama go waka the first year alone.')}</p>
    </main>
  );
}
