import type { ReactNode } from 'react';
import { growthCurves } from './engine/growth';
import type { Sex } from './engine/data';
import { useL } from './store';
import { usePhotos, blobUrl } from './platform';

/* One consistent line-icon set: 24px grid, 1.75 stroke, round joins. */
const P: Record<string, ReactNode> = {
  home: <><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V20h14V9.5" /></>,
  baby: <><circle cx="12" cy="8" r="4.5" /><path d="M5.5 21c.6-4 3.2-6.5 6.5-6.5s5.9 2.5 6.5 6.5" /></>,
  circle: <><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c.4-3.6 3-6 6.5-6s6.1 2.4 6.5 6" /><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.3c2 .8 3.3 2.9 3.5 5.7" /></>,
  doctor: <><path d="M6 3v5a4 4 0 0 0 8 0V3" /><path d="M10 12v3a5 5 0 0 0 10 0v-1.5" /><circle cx="20" cy="11.5" r="2" /></>,
  heart: <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" />,
  alert: <><path d="M12 3 2.5 20h19z" /><path d="M12 10v4M12 17h.01" /></>,
  mic: <><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></>,
  phone: <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" />,
  x: <path d="M6 6l12 12M18 6 6 18" />,
  back: <path d="M15 5 8 12l7 7" />,
  chevron: <path d="m9 6 6 6-6 6" />,
  check: <path d="m5 12 5 5 9-10" />,
  calendar: <><rect x="3.5" y="5" width="17" height="15" rx="3" /><path d="M3.5 10h17M8 3v4M16 3v4" /></>,
  moon: <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z" />,
  syringe: <path d="m18 2 4 4M17 7l3-3M19 9 8.7 19.3a2 2 0 0 1-2.8 0l-1.2-1.2a2 2 0 0 1 0-2.8L15 5M9 11l4 4M5 19l-3 3" />,
  send: <path d="M4 12 20 4l-6 16-3-7-7-1Z" />,
  play: <><circle cx="12" cy="12" r="9" /><path d="M10 8.5v7l6-3.5z" /></>,
  keyboard: <><rect x="3" y="6" width="18" height="12" rx="2.5" /><path d="M7 10h.01M11 10h.01M15 10h.01M8 14h8" /></>,
  chat: <path d="M20 12a8 8 0 0 1-11.6 7.1L4 20l1-4A8 8 0 1 1 20 12Z" />,
  gear: <><circle cx="12" cy="12" r="3" /><path d="M12 2.5v2.2M12 19.3v2.2M4.6 4.6l1.6 1.6M17.8 17.8l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.6 19.4l1.6-1.6M17.8 6.2l1.6-1.6" /></>,
  scale: <><rect x="3.5" y="4" width="17" height="16" rx="4" /><path d="M8.5 9a5 5 0 0 1 7 0L12 12.5" /></>,
  bottle: <path d="M9 3h6M10 3v3l-2 3v11a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V9l-2-3V3" />,
  sparkle: <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" />,
  search: <><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4-4" /></>,
  book: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z" /><path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20" /></>,
  whatsapp: <><path d="M20 11.6a8 8 0 0 1-11.8 7L4 20l1.4-4.1A8 8 0 1 1 20 11.6Z" /><path d="M9 8.8c.3 2.5 2 4.5 4.6 5.4l1-1.1 1.8.8-.3 1.5c-3.6.3-7.5-3.4-7.3-7.1l1.5-.3.8 1.8z" /></>,
  pin: <><path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z" /><circle cx="12" cy="10" r="2.3" /></>,
};
export const Icon = ({ n, label, size }: { n: string; label?: string; size?: number }) => (
  <svg className="ico" viewBox="0 0 24 24" aria-hidden={label ? undefined : true} role={label ? 'img' : undefined} aria-label={label} style={size ? { width: size, height: size } : undefined}>{P[n]}</svg>
);

/** The SweetMom mark: a mother (head and embracing arms) holding her baby, inside one circle.
 *  tone "solid" = berry circle for light screens; "soft" = blush circle; "onDark" = for berry backgrounds. */
export const Mark = ({ size = 32, tone = 'solid' }: { size?: number; tone?: 'solid' | 'soft' | 'onDark' }) => {
  const c = tone === 'solid' ? { bg: '#E30B5D', fig: '#FFFFFF', baby: '#FFC2D7' } : tone === 'soft' ? { bg: '#FFE6EF', fig: '#E30B5D', baby: '#FF8FB6' } : { bg: 'rgba(255,255,255,.16)', fig: '#FFFFFF', baby: '#FFC2D7' };
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" aria-hidden="true">
      <circle cx="100" cy="100" r="96" fill={c.bg} />
      <circle cx="84" cy="62" r="21" fill={c.fig} />
      <path d="M80 94 C 46 102, 38 146, 66 164 C 92 180, 136 172, 156 140 C 166 124, 164 106, 152 98" fill="none" stroke={c.fig} strokeWidth="17" strokeLinecap="round" />
      <circle cx="122" cy="128" r="19" fill={c.baby} />
    </svg>
  );
};
export const Wordmark = ({ size = 24, color = 'var(--plum)' }: { size?: number; color?: string }) => (
  <span className="serif" style={{ fontSize: size, color, lineHeight: 1 }}>Sweet<span style={{ fontStyle: 'italic', fontWeight: 600 }}>Mom</span></span>
);

/** Photo slot. Shows a real photograph once one is uploaded for this slot in the Team dashboard, otherwise a calm placeholder. */
export function Photo({ id, h = 160, label, radius = 22 }: { id: string; h?: number; label: string; radius?: number }) {
  const photos = usePhotos();
  const src = photos[id] ? blobUrl(photos[id]) : '';
  if (src) return <img src={src} alt={label} style={{ width: '100%', height: h, objectFit: 'cover', borderRadius: radius, display: 'block' }} />;
  return (
    <div role="img" aria-label={label} style={{ height: h, borderRadius: radius, background: 'var(--blush)', position: 'relative', overflow: 'hidden', display: 'grid', placeItems: 'center' }}>
      <svg width="100%" height="100%" viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true" style={{ position: 'absolute', inset: 0 }}>
        <circle cx="330" cy="40" r="90" fill="#F9D5E2" />
        <circle cx="60" cy="190" r="80" fill="#FFE6EF" />
      </svg>
      <div style={{ position: 'relative' }}><Mark size={Math.min(72, h * 0.45)} tone="soft" /></div>
    </div>
  );
}

export function TabBar({ tab, go }: { tab: string; go: (t: Tab) => void }) {
  const L = useL();
  const items: [Tab, string, string][] = [['home', 'home', L('Home')], ['baby', 'baby', L('Baby', 'Pikin')], ['circle', 'circle', L('Circle')], ['learn', 'book', L('Learn')], ['me', 'heart', L('Me')]];
  return (
    <nav className="tabbar" aria-label="Main">
      <div className="tabbar-in">
        {items.map(([id, ic, label]) => (
          <button key={id} aria-current={tab === id ? 'page' : undefined} onClick={() => go(id)}>
            <span className="pill"><Icon n={ic} /></span>{label}
          </button>
        ))}
      </div>
    </nav>
  );
}
export type Tab = 'home' | 'baby' | 'circle' | 'learn' | 'me';

/** Dr SweetMom is always one tap away, on every main screen. */
export function AskFab({ onClick }: { onClick: () => void }) {
  const L = useL();
  return <button className="ask-fab" onClick={onClick} aria-label={L('Ask Dr SweetMom')}><Mark size={30} tone="onDark" /><span>{L('Ask Dr SweetMom')}</span></button>;
}

export function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const L = useL();
  return (
    <div className="sheet" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sheet-in">
        <div className="grab" />
        <div className="row between" style={{ marginBottom: 12 }}>
          <h1 style={{ fontSize: 21 }}>{title}</h1>
          <button className="ghost-round" aria-label={L('Close')} onClick={onClose}><Icon n="x" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export const Wave = ({ bars = 16, color }: { bars?: number; color?: string }) => (
  <span className="wave" aria-hidden style={{ color }}>
    {Array.from({ length: bars }, (_, i) => <i key={i} style={{ height: 4 + ((i * 7) % 17) }} />)}
  </span>
);

export function HelpPill({ onClick }: { onClick: () => void }) {
  const L = useL();
  return <button className="help-pill" onClick={onClick}><Icon n="alert" />{L('Need help now', 'I need help now')}</button>;
}

/** Weight-for-age chart with WHO curves; the green band is the healthy range. */
export function GrowthChart({ sex, points }: { sex: Sex; points: { x: number; y: number }[] }) {
  const curves = growthCurves('weightForAge', sex).filter((c) => c.x <= 12);
  const W = 340, H = 200, pl = 28, pb = 22, pt = 10, pr = 8;
  const maxX = 12;
  const maxY = Math.ceil(Math.max(...curves.map((c) => c.sd3), ...points.map((p) => p.y)));
  const X = (x: number) => pl + (x / maxX) * (W - pl - pr);
  const Y = (y: number) => pt + (1 - y / maxY) * (H - pt - pb);
  const line = (k: 'sdNeg2' | 'median' | 'sd2') => curves.map((c, i) => `${i ? 'L' : 'M'}${X(c.x).toFixed(1)},${Y(c[k]).toFixed(1)}`).join(' ');
  const band = `${curves.map((c, i) => `${i ? 'L' : 'M'}${X(c.x)},${Y(c.sd2)}`).join(' ')} ${[...curves].reverse().map((c) => `L${X(c.x)},${Y(c.sdNeg2)}`).join(' ')} Z`;
  return (
    <div className="chart-box">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Weight for age compared with the WHO healthy range">
        <path d={band} fill="var(--sage)" />
        {[0, 3, 6, 9, 12].map((m) => <text key={m} x={X(m)} y={H - 6} textAnchor="middle" fontSize="11" fill="var(--ink-3)">{m}m</text>)}
        {Array.from({ length: Math.floor(maxY / 3) + 1 }, (_, i) => i * 3).map((kg) => (
          <g key={kg}><line x1={pl} x2={W - pr} y1={Y(kg)} y2={Y(kg)} stroke="var(--line-2)" /><text x={pl - 6} y={Y(kg) + 4} textAnchor="end" fontSize="11" fill="var(--ink-3)">{kg}</text></g>
        ))}
        <path d={line('median')} fill="none" stroke="var(--sage-ink)" strokeWidth="1.5" strokeDasharray="4 4" />
        {points.length > 1 && <path d={points.map((p, i) => `${i ? 'L' : 'M'}${X(p.x)},${Y(p.y)}`).join(' ')} fill="none" stroke="var(--rose)" strokeWidth="2.5" />}
        {points.map((p, i) => <circle key={i} cx={X(p.x)} cy={Y(p.y)} r="5" fill="var(--rose)" stroke="var(--surface)" strokeWidth="2" />)}
      </svg>
      <p className="xs muted">Green band: the WHO healthy range. Dots: your baby's weights.</p>
    </div>
  );
}
