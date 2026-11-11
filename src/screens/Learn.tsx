import { useState } from 'react';
import { useStore, useL } from '../store';
import { Icon, Photo } from '../components';
import { ARTICLES, TOPICS, ARTICLE_BY_ID, type Topic } from '../content/learn';
import { stageFor } from '../content/journey';
import { babyDays } from '../derive';

export function Learn({ open }: { open: (id: string) => void }) {
  const { s } = useStore();
  const L = useL();
  const [topic, setTopic] = useState<Topic | 'stage'>('stage');
  const [q, setQ] = useState('');
  const st = stageFor(babyDays(s));
  const qq = q.trim().toLowerCase();
  const list = qq ? ARTICLES.filter((a) => `${a.title} ${a.summary} ${a.keywords.join(' ')}`.toLowerCase().includes(qq))
    : topic === 'stage' ? st.learn.map((id) => ARTICLE_BY_ID[id]).filter(Boolean) : ARTICLES.filter((a) => a.topic === topic);
  return (
    <main className="page" style={{ paddingBottom: 150 }}>
      <h1>{L('Learn', 'Learn')}</h1>
      <p className="muted mt8">{L('Short, doctor-checked guides for SweetMoms. Read in two minutes.', 'Short guide wey doctor check for SweetMoms. Two minutes read.')}</p>
      <div className="composer mt12">
        <Icon n="search" size={18} />
        <label htmlFor="lq" className="sr">{L('Search guides')}</label>
        <input id="lq" type="text" placeholder={L('Search: sleep, latch, fever...', 'Search: sleep, latch, fever...')} value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      {!qq && (
        <div className="chips mt12" style={{ flexWrap: 'nowrap', overflowX: 'auto', paddingBottom: 4 }}>
          <button className="chip-btn" style={{ flex: 'none' }} aria-pressed={topic === 'stage'} onClick={() => setTopic('stage')}>{L('For your stage', 'For your stage')}</button>
          {TOPICS.map((t) => <button key={t.id} className="chip-btn" style={{ flex: 'none' }} aria-pressed={topic === t.id} onClick={() => setTopic(t.id)}>{L(t.en, t.pcm)}</button>)}
        </div>
      )}
      {!qq && topic === 'stage' && list[0] && (
        <button className="card photo-card mt12" style={{ width: '100%', textAlign: 'left' }} onClick={() => open(list[0].id)}>
          <Photo id={`learn-${list[0].id}`} h={170} radius={0} label={list[0].title} />
          <div className="pad">
            <div className="eyebrow" style={{ color: 'var(--rose)' }}>{s.lang === 'pcm' ? st.name.pcm : st.name.en}</div>
            <div className="serif" style={{ fontSize: 24, marginTop: 4 }}>{list[0].title}</div>
            <p className="sm muted mt8">{list[0].summary}</p>
          </div>
        </button>
      )}
      <div className="mt12">
        {(topic === 'stage' && !qq ? list.slice(1) : list).map((a) => (
          <button key={a.id} className="card row mt8" style={{ width: '100%', textAlign: 'left', padding: 10 }} onClick={() => open(a.id)}>
            <div style={{ width: 72, flex: 'none' }}><Photo id={`learn-${a.id}`} h={64} radius={14} label={a.title} /></div>
            <div style={{ flex: 1 }}><div style={{ fontWeight: 800, lineHeight: 1.3 }}>{a.title}</div><div className="xs muted">{a.summary}</div></div>
          </button>
        ))}
        {list.length === 0 && <p className="muted mt12">{L('Nothing found. Try another word, or ask Dr SweetMom.', 'We no see am. Try another word, or ask Dr SweetMom.')}</p>}
      </div>
    </main>
  );
}

export function Article({ id, onClose, onAsk }: { id: string; onClose: () => void; onAsk: () => void }) {
  const L = useL();
  const a = ARTICLE_BY_ID[id];
  if (!a) return null;
  return (
    <main className="page" style={{ paddingBottom: 40 }}>
      <div className="head"><button className="ghost-round" aria-label={L('Back')} onClick={onClose}><Icon n="back" /></button><span className="xs muted" style={{ fontWeight: 700 }}>{a.minutes} min {L('read')}</span></div>
      <div className="mt12"><Photo id={`learn-${a.id}`} h={200} label={a.title} /></div>
      <h1 style={{ marginTop: 18, fontSize: 32 }}>{a.title}</h1>
      <p className="muted mt8" style={{ fontSize: 17 }}>{a.summary}</p>
      {a.body.map((p, i) => <p key={i} style={{ marginTop: 14, fontSize: 16.5, lineHeight: 1.65 }}>{p}</p>)}
      <div className="src mt16"><Icon n="check" size={14} />{a.approvedBy ? L(`Checked by ${a.approvedBy}`) : L('Draft: awaiting doctor review', 'Draft: doctor never check am')}</div>
      <button className="btn block mt16" onClick={onAsk}>{L('Ask Dr SweetMom about this')}</button>
    </main>
  );
}
