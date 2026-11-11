import { useEffect, useState } from 'react';
import { Icon, Photo } from '../components';
import { useCap, useViewer, usePhotos } from '../platform';
import { ARTICLES } from '../content/learn';

/* eslint-disable @typescript-eslint/no-explicit-any */
type TM = { who: 'mum' | 'doctor'; text: string; at: string };
type Q = { id: string; messages: TM[]; status: string; updatedAt: string; babyWeeks?: number };
type P = { id: string; circle: string; authorId: string; text: string; createdAt: string; supermom?: boolean };

/** For the SweetMom team (the artifact owner and editors). Mothers never see this screen. */
export function Team({ onClose }: { onClose: () => void }) {
  const db = useCap<any>('db');
  const assets = useCap<any>('assets');
  const { user, me } = useViewer();
  const photos = usePhotos();
  const [tab, setTab] = useState<'inbox' | 'circle' | 'photos'>('inbox');
  const [qs, setQs] = useState<Q[]>([]);
  const [posts, setPosts] = useState<P[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [open, setOpen] = useState<string | null>(null);
  const [reply, setReply] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState('');
  const [circle, setCircle] = useState('');
  const [sp, setSp] = useState('');

  useEffect(() => {
    if (!db) return;
    const offs: (() => void)[] = [];
    try {
      offs.push(db.collection('doctorQuestions').onSnapshot((snap: any) => setQs(snap.docs.map((x: any) => ({ id: x.id, ...x.data() })).sort((a: Q, b: Q) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''))), () => setMsg('Could not load questions. Check that you are the owner or an editor of this artifact.')));
      offs.push(db.collection('circlePosts').onSnapshot((snap: any) => setPosts(snap.docs.map((x: any) => ({ id: x.id, ...x.data() })).sort((a: P, b: P) => b.createdAt.localeCompare(a.createdAt))), () => {}));
    } catch { setMsg('The shared database is not available here.'); }
    return () => offs.forEach((f) => f());
  }, [db]);
  useEffect(() => {
    if (!user) return;
    const ids = [...new Set([...qs.map((q) => q.id), ...posts.map((p) => p.authorId)])];
    if (ids.length) user.profiles(ids).then((ps: Record<string, { name: string }>) => setNames(Object.fromEntries(ids.map((id) => [id, ps[id]?.name || 'A SweetMom'])))).catch(() => {});
  }, [user, qs, posts]);

  const sendReply = async (q: Q) => {
    if (!reply.trim()) return;
    setBusy(q.id);
    try {
      await db.doc(`doctorQuestions/${q.id}`).update({ messages: [...q.messages, { who: 'doctor', text: reply.trim(), at: new Date().toISOString() }], status: 'answered', updatedAt: new Date().toISOString() });
      setReply('');
    } catch { setMsg('Reply could not be sent.'); } finally { setBusy(''); }
  };
  const upload = async (slot: string, file?: File) => {
    if (!file || !assets || !db) return;
    setBusy(slot);
    try {
      const r = await assets.upload(file);
      await db.doc('settings/photos').set({ ...photos, [slot]: r.id });
    } catch (e) { setMsg(`Upload failed${(e as { code?: string })?.code ? ` (${(e as { code: string }).code})` : ''}.`); } finally { setBusy(''); }
  };
  const circles = [...new Set(posts.map((p) => p.circle))];
  const openQ = qs.find((q) => q.id === open);

  if (me && !me.isOwner && !me.canEdit) return <main className="page"><button className="ghost-round" aria-label="Back" onClick={onClose}><Icon n="back" /></button><p className="mt16">This area is for the SweetMom team.</p></main>;

  return (
    <main className="page" style={{ paddingBottom: 40 }}>
      <div className="head"><button className="ghost-round" aria-label="Back" onClick={onClose}><Icon n="back" /></button><h1 style={{ flex: 1 }}>SweetMom Team</h1></div>
      <p className="sm muted mt8">Only you and editors of this app see this page.</p>
      {!db && db !== undefined && <p className="note amber mt12">The shared database is not available in this view. Open the app from its claude.ai link while signed in.</p>}
      {msg && <p className="note amber mt12">{msg}</p>}
      <div className="chips mt12">
        <button className="chip-btn" aria-pressed={tab === 'inbox'} onClick={() => setTab('inbox')}>Doctor inbox {qs.filter((q) => q.status === 'open').length ? `(${qs.filter((q) => q.status === 'open').length})` : ''}</button>
        <button className="chip-btn" aria-pressed={tab === 'circle'} onClick={() => setTab('circle')}>Circles</button>
        <button className="chip-btn" aria-pressed={tab === 'photos'} onClick={() => setTab('photos')}>Photos</button>
      </div>

      {tab === 'inbox' && !openQ && (
        <section className="card mt12" style={{ padding: '4px 16px' }}>
          {qs.length === 0 && <p className="sm muted" style={{ padding: '12px 0' }}>No questions yet.</p>}
          {qs.map((q) => (
            <button key={q.id} className="list-row" onClick={() => { setOpen(q.id); setReply(''); }}>
              <span className="avatar av-mum" style={{ width: 36, height: 36, fontSize: 13 }} aria-hidden>{(names[q.id] || 'S').slice(0, 1)}</span>
              <span style={{ flex: 1 }}>
                <span style={{ display: 'block', fontWeight: 800 }}>{names[q.id] || 'A SweetMom'}{q.babyWeeks != null ? `, baby ${q.babyWeeks} weeks` : ''}</span>
                <span className="xs muted" style={{ display: 'block' }}>{q.messages[q.messages.length - 1]?.text.slice(0, 80)}</span>
              </span>
              <span className={`badge ${q.status === 'answered' ? 'b-sage' : 'b-amber'}`}>{q.status === 'answered' ? 'Replied' : 'Open'}</span>
            </button>
          ))}
        </section>
      )}
      {tab === 'inbox' && openQ && (
        <section className="card mt12">
          <div className="row between"><div style={{ fontWeight: 800 }}>{names[openQ.id] || 'A SweetMom'}</div><button className="link" onClick={() => setOpen(null)}>All questions</button></div>
          <div className="chat mt12">{openQ.messages.map((m, i) => <div key={i} className={`bubble ${m.who === 'doctor' ? 'me' : 'dr'}`}>{m.text}<div className="xs" style={{ opacity: 0.7, marginTop: 4 }}>{new Date(m.at).toLocaleString()}</div></div>)}</div>
          <label className="field" htmlFor="rp">Your reply as a SweetMom doctor</label>
          <textarea id="rp" value={reply} onChange={(e) => setReply(e.target.value)} />
          <button className="btn block mt12" disabled={!reply.trim() || busy === openQ.id} onClick={() => sendReply(openQ)}>Send reply</button>
          <p className="xs muted mt8">If the message suggests danger or thoughts of self-harm, call the mother or her clinic directly. Do not rely on chat.</p>
        </section>
      )}

      {tab === 'circle' && (
        <>
          <section className="card mt12">
            <div style={{ fontWeight: 800 }}>Post as Supermom</div>
            <label className="field" htmlFor="ck">Circle</label>
            <input id="ck" type="text" list="circles" placeholder="e.g. rumuola-0-3" value={circle} onChange={(e) => setCircle(e.target.value)} />
            <datalist id="circles">{circles.map((c) => <option key={c} value={c} />)}</datalist>
            <label className="field" htmlFor="sp">Message</label>
            <textarea id="sp" value={sp} onChange={(e) => setSp(e.target.value)} />
            <button className="btn block mt12" disabled={!circle.trim() || !sp.trim() || !me?.id} onClick={() => db.collection('circlePosts').add({ circle: circle.trim(), authorId: me!.id, text: sp.trim(), createdAt: new Date().toISOString(), supermom: true }).then(() => setSp('')).catch(() => setMsg('Post failed.'))}>Post</button>
            <p className="xs muted mt8">Circle names are the mother's area plus the baby's age band, for example rumuola-0-3.</p>
          </section>
          {posts.map((p) => (
            <article key={p.id} className="card mt8">
              <div className="row between"><span className="xs muted" style={{ fontWeight: 700 }}>{p.circle}, {names[p.authorId] || 'A SweetMom'}</span><button className="link" style={{ color: 'var(--danger-text)' }} onClick={() => db.doc(`circlePosts/${p.id}`).delete().catch(() => setMsg('Could not remove.'))}>Remove</button></div>
              <p className="sm mt8">{p.text}</p>
            </article>
          ))}
        </>
      )}

      {tab === 'photos' && (
        <>
          <p className="sm muted mt12">Upload your own or licensed photos. Each one appears for every mother in that place in the app.</p>
          {!assets && assets !== undefined && <p className="note amber mt12">Uploads need editor access to this artifact.</p>}
          {ARTICLES.map((a) => (
            <section key={a.id} className="card row mt8" style={{ padding: 10 }}>
              <div style={{ width: 84, flex: 'none' }}><Photo id={`learn-${a.id}`} h={60} radius={12} label={a.title} /></div>
              <div style={{ flex: 1 }} className="sm"><strong>{a.title}</strong></div>
              <label className="btn sm line" style={{ cursor: 'pointer' }}>
                {busy === `learn-${a.id}` ? 'Uploading...' : photos[`learn-${a.id}`] ? 'Replace' : 'Upload'}
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => upload(`learn-${a.id}`, e.target.files?.[0])} />
              </label>
            </section>
          ))}
        </>
      )}
    </main>
  );
}
