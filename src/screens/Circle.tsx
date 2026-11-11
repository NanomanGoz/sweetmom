import { useEffect, useState } from 'react';
import { useCap, useViewer } from '../platform';
import { useStore, useL, uid } from '../store';
import { Icon, Wave, Sheet } from '../components';
import { babyMonths, safetyCheck } from '../derive';
import { listen, speechSupported } from '../ai';
import { CONTACTS } from '../config/contacts';

export function Circle({ onHelp }: { onHelp: () => void }) {
  const { s, d } = useStore();
  const L = useL();
  const [text, setText] = useState('');
  const [rec, setRec] = useState(false);
  const [help, setHelp] = useState(false);
  const [note, setNote] = useState('');
  const m = Math.floor(babyMonths(s));
  const band = m < 3 ? L('0 to 3 months') : m < 6 ? L('3 to 6 months') : m < 9 ? L('6 to 9 months') : L('9 to 12 months');
  const area = s.mother?.area || L('Your area');
  const name = `${area} ${L('Mums', 'Mamas')}`;
  const key = `${(s.mother?.area || 'general').toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${m < 3 ? '0-3' : m < 6 ? '3-6' : m < 9 ? '6-9' : '9-12'}`;
  const db = useCap<any>('db');
  const { user, me } = useViewer();
  type SP = { id: string; authorId: string; text: string; createdAt: string; supermom?: boolean };
  const [shared, setShared] = useState<SP[] | null>(null);
  const [names, setNames] = useState<Record<string, string>>({});
  useEffect(() => {
    if (!db) { setShared(null); return; }
    let unsub = () => {};
    const timer = setTimeout(() => setShared((x) => x ?? []), 10000);
    try {
      unsub = db.collection('circlePosts').where('circle', '==', key).onSnapshot((snap: any) => {
        clearTimeout(timer);
        setShared(snap.docs.map((x: any) => ({ id: x.id, ...x.data() })).sort((a: SP, b: SP) => b.createdAt.localeCompare(a.createdAt)).slice(0, 60));
      }, () => { clearTimeout(timer); setShared(null); });
    } catch { setShared(null); }
    return () => { unsub(); clearTimeout(timer); };
  }, [db, key]);
  useEffect(() => {
    if (!user || !shared?.length) return;
    const ids = [...new Set(shared.map((p) => p.authorId))];
    user.profiles(ids).then((ps: Record<string, { name: string; isMe: boolean }>) => setNames(Object.fromEntries(ids.map((id) => [id, ps[id]?.isMe ? L('You') : ps[id]?.name || L('A SweetMom')])))).catch(() => {});
  }, [user, shared]);
  const ago = (iso: string) => { const mins = Math.max(0, Math.round((Date.now() - Date.parse(iso)) / 60000)); return mins < 60 ? `${mins} min` : mins < 1440 ? `${Math.round(mins / 60)} h` : `${Math.round(mins / 1440)} d`; };

  const post = (voiceSecs?: number) => {
    const t = text.trim();
    if (!t && !voiceSecs) return;
    if (t && safetyCheck(t) === 'self_harm') { onHelp(); }
    if (db && me?.id && t) {
      db.collection('circlePosts').add({ circle: key, authorId: me.id, text: t, createdAt: new Date().toISOString(), supermom: !!me.isOwner })
        .then(() => setText(''))
        .catch(() => setNote(L('Your post could not be shared. You may only have view access to this Circle.', 'Your post no fit share. Maybe na only view access you get.')));
      return;
    }
    d({ type: 'post', p: { id: uid(), author: s.mother?.name ?? L('You'), initial: (s.mother?.name ?? 'Y').slice(0, 1), tint: 'mum', text: t || L('Voice note'), voiceSecs, at: L('now'), replies: 0, mine: true } });
    setText('');
  };
  const dictate = () => {
    if (!speechSupported()) { setNote(L('Voice is not available on this phone yet. Please type instead.', 'Voice never dey work for this phone. Abeg type am.')); return; }
    setRec(true); setNote('');
    listen((p) => setText(p), (t) => { setRec(false); if (t) setText(t); }, () => { setRec(false); setNote(L('We could not hear you. Please try again or type.', 'We no hear you. Try again or type am.')); });
  };

  if (!s.circle.joined) return (
    <main className="page">
      <h1>{L('SweetMom Circle')}</h1>
      <p className="muted mt8">{L('Becoming a mother can feel lonely. Your Circle is a small, private group of mums near you with babies the same age, led by a Supermom: an experienced mum trained by SweetMom.', 'To be new mama fit lonely. Your Circle na small private group of mamas near you wey their pikin be the same age. Supermom, experienced mama wey SweetMom train, dey lead am.')}</p>
      <section className="hero mt16">
        <div className="k">{L('We found a Circle for you', 'We see Circle for you')}</div>
        <div className="big">{name}</div>
        <div className="sm" style={{ color: '#FFFFFF', marginTop: 4 }}>{L(`Babies ${band}`, `Pikin ${band}`)}</div>
        <button className="btn white block mt16" onClick={() => d({ type: 'set', patch: { circle: { ...s.circle, joined: true } } })}>{L('Join my Circle', 'Join my Circle')}</button>
      </section>
      <p className="xs muted mt12">{L('In this prototype, Circle members and posts are examples on your phone. In the pilot, Circles are matched by area and baby age, and every Circle has a trained Supermom.', 'For this prototype, Circle members and post na example. For pilot, we go match Circle by area and pikin age, and every Circle get trained Supermom.')}</p>
    </main>
  );

  return (
    <main className="page" style={{ paddingBottom: 180 }}>
      <div className="head between">
        <h1>{L('Your Circle')}</h1>
        <button className="q-btn" aria-label={L('How Circles work')} onClick={() => setHelp(true)}>?</button>
      </div>
      <section className="hero mt12" style={{ padding: 18 }}>
        <div style={{ fontSize: 20, fontWeight: 800, position: 'relative' }}>{name}</div>
        <div className="sm" style={{ color: '#FFFFFF', marginTop: 2 }}>{L(`Babies ${band}, 14 mums near you`, `Pikin ${band}, 14 mamas near you`)}</div>
        <div className="glass row mt12">
          <div className="avatar" style={{ width: 36, height: 36, fontSize: 14, background: '#FFC2D7', color: '#E30B5D' }} aria-hidden>N</div>
          <div className="xs" style={{ flex: 1, lineHeight: 1.4 }}><strong style={{ fontSize: 14 }}>Nkechi</strong>, {L('your Supermom', 'your Supermom')}<br /><span style={{ color: '#FFFFFF' }}>{L('Mum of two, trained by SweetMom', 'Mama of two, SweetMom train am')}</span></div>
        </div>
      </section>

      {CONTACTS.circleGroup
        ? <a className="btn block mt12 wa-btn" href={CONTACTS.circleGroup} target="_blank" rel="noopener noreferrer"><Icon n="whatsapp" size={20} />{L('Open our WhatsApp group', 'Open our WhatsApp group')}</a>
        : <p className="note plum mt12">{L('Your Circle also meets on WhatsApp. The group link will appear here once your Supermom adds it.', 'Your Circle dey meet for WhatsApp too. The group link go show here when your Supermom add am.')}</p>}

      <section className="tile t-peach row mt12" style={{ gap: 12 }}>
        <div className="icon-sq" style={{ width: 44, height: 44, background: 'var(--surface)', color: 'var(--peach-ink)' }}><Icon n="calendar" /></div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800 }}>{L('Meetup, Saturday 10 am', 'Meetup, Saturday 10 am')}</div>
          <div className="xs" style={{ color: 'var(--peach-ink)' }}>{L(`${area} health centre, ${s.circle.going ? 7 : 6} going`, `${area} health centre, ${s.circle.going ? 7 : 6} dey come`)}</div>
        </div>
        <button className="btn sm" aria-pressed={s.circle.going} onClick={() => d({ type: 'set', patch: { circle: { ...s.circle, going: !s.circle.going } } })}>{s.circle.going ? L("I'm going ✓", 'I dey come ✓') : L("I'll come", 'I go come')}</button>
      </section>

      {shared !== null && (
        <>
          {shared.length === 0 && <p className="note sage mt12">{L('This Circle is new. Say hello and introduce yourself and your baby.', 'This Circle still new. Greet everybody and introduce yourself and your pikin.')}</p>}
          {shared.map((p) => (
            <article key={p.id} className="card mt12">
              <div className="row">
                <div className={`avatar ${p.supermom ? 'av-peach' : 'av-mum'}`} style={{ width: 34, height: 34, fontSize: 13 }} aria-hidden>{(names[p.authorId] || 'S').slice(0, 1)}</div>
                <div className="sm" style={{ flex: 1, fontWeight: 800 }}>{names[p.authorId] || L('A SweetMom')} <span className="xs muted" style={{ fontWeight: 600 }}>{ago(p.createdAt)}</span></div>
                {p.supermom && <span className="badge b-plum">{L('Supermom')}</span>}
                {me?.isOwner && <button className="link" style={{ color: 'var(--danger-text)' }} onClick={() => db.doc(`circlePosts/${p.id}`).delete().catch(() => {})}>{L('Remove')}</button>}
              </div>
              <p style={{ marginTop: 8, fontSize: 15 }}>{p.text}</p>
            </article>
          ))}
          {shared.length === 0 && <div className="eyebrow mt16 muted">{L('Examples of what mums share', 'Example of wetin mamas dey share')}</div>}
        </>
      )}
      {(shared === null || shared.length === 0) && s.circle.posts.map((p) => (
        <article key={p.id} className="card mt12">
          <div className="row">
            <div className={`avatar ${p.tint === 'mum' ? 'av-mum' : p.tint === 'baby' ? 'av-baby' : 'av-peach'}`} style={{ width: 34, height: 34, fontSize: 13 }} aria-hidden>{p.initial}</div>
            <div className="sm" style={{ flex: 1, fontWeight: 800 }}>{p.author} <span className="xs muted" style={{ fontWeight: 600 }}>{p.at}</span></div>
            {p.mentor && <span className="badge b-plum">{L('Supermom')}</span>}
          </div>
          {p.voiceSecs ? (
            <div className="row mt12" style={{ background: 'var(--sunk)', borderRadius: 999, padding: '6px 14px 6px 6px' }}>
              <span className="round-plum" style={{ width: 34, height: 34 }} aria-hidden><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M7 4.5v15l12-7.5z" /></svg></span>
              <span style={{ flex: 1, color: 'var(--rose)' }}><Wave bars={20} /></span>
              <span className="xs muted" style={{ fontWeight: 700 }}>0:{String(p.voiceSecs).padStart(2, '0')}</span>
            </div>
          ) : null}
          <p style={{ marginTop: 8, fontSize: 15 }}>{p.text}</p>
          {p.replies > 0 && <div className="xs" style={{ marginTop: 8, fontWeight: 700, color: 'var(--rose)' }}>{L(`${p.replies} replies`, `${p.replies} replies`)}</div>}
        </article>
      ))}

      <div className="chat-dock">
        <div className="in">
          {note && <p className="xs muted" style={{ marginBottom: 6 }}>{note}</p>}
          <div className="composer">
            <label htmlFor="post" className="sr">{L('Write to your Circle')}</label>
            <input id="post" type="text" placeholder={rec ? L('Listening...', 'I dey listen...') : L('Share with your Circle...', 'Share with your Circle...')} value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') post(); }} />
            {text.trim()
              ? <button className="round-plum" aria-label={L('Post')} onClick={() => post()}><Icon n="send" /></button>
              : <button className={`round-plum ${rec ? 'live' : ''}`} aria-label={L('Speak your message')} onClick={dictate}><Icon n="mic" /></button>}
          </div>
        </div>
      </div>

      {help && (
        <Sheet title={L('How Circles work')} onClose={() => setHelp(false)}>
          <ol style={{ paddingLeft: 20, margin: 0, display: 'grid', gap: 10, lineHeight: 1.5 }}>
            <li>{L('You are matched with mums near you whose babies are about the same age.', 'We match you with mamas near you wey their pikin be about the same age.')}</li>
            <li>{L('Your Supermom, an experienced mum trained by SweetMom, leads the Circle and keeps it safe and kind. She will check on you when you are having a hard time.', 'Your Supermom, experienced mama wey SweetMom train, dey lead the Circle and keep am safe and kind. She go check on you when e hard for you.')}</li>
            <li>{L('Share by typing or by voice. Meet in person at Circle meetups.', 'Share by typing or by voice. Meet face to face for Circle meetup.')}</li>
            <li>{L('Circle members are not doctors. For health questions, ask Dr SweetMom.', 'Circle members no be doctor. For health question, ask Dr SweetMom.')}</li>
          </ol>
        </Sheet>
      )}
    </main>
  );
}
