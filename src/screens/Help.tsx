import { useStore, useL } from '../store';
import { Icon } from '../components';
import { MUM_DANGER, BABY_DANGER } from '../content/firstyear';

/** Always reachable. Self-harm support first, then danger signs for mother and baby.
 *  Phone numbers are placeholders until real, named partners confirm (clinic, counsellor, 24-hour line). */
import { CONTACTS, waLink } from '../config/contacts';

export function Help({ onClose }: { onClose: () => void }) {
  const { s } = useStore();
  const L = useL();
  const bname = s.baby?.name ?? L('your baby', 'your pikin');
  return (
    <div className="help-screen" role="alertdialog" aria-modal="true" aria-labelledby="help-title">
      <div className="inner">
        <div className="row between">
          <h1 id="help-title" style={{ fontSize: 28, color: '#FFFFFF' }}>{L('Need help now', 'I need help now')}</h1>
          <button onClick={onClose} aria-label={L('Close')} style={{ width: 44, height: 44, borderRadius: '50%', border: '1px solid rgba(255,255,255,.4)', background: 'transparent', color: '#fff', display: 'grid', placeItems: 'center' }}><Icon n="x" /></button>
        </div>

        <section style={{ marginTop: 16, background: '#FFFFFF', color: '#241A26', borderRadius: 22, padding: 16 }}>
          <div style={{ fontSize: 16, fontWeight: 800, lineHeight: 1.3 }}>{L('Thinking of hurting yourself or your baby, or feel you cannot go on?', 'You dey think to harm yourself or your pikin, or you feel say you no fit continue?')}</div>
          <p className="sm" style={{ marginTop: 4, color: '#5E5360' }}>{L('You are not alone, and this is not your fault. You deserve help right now.', 'You no dey alone, and e no be your fault. You deserve help now now.')}</p>
          {CONTACTS.supportLine
            ? <a className="btn block mt12" href={`tel:${CONTACTS.supportLine}`} style={{ background: '#E30B5D' }}><Icon n="phone" size={18} />{L('Talk to someone now', 'Talk to person now')}</a>
            : <div className="mt12" style={{ background: '#F6F1F4', borderRadius: 14, padding: 12, fontSize: 14, color: '#4A3F4C' }}>{L('Call a trusted person to come and be with you now, or go to the nearest hospital. [24-hour support line to be confirmed before launch.]', 'Call person wey you trust make e come stay with you now, or go the nearest hospital. [24-hour support line go dey confirmed before launch.]')}</div>}
          {CONTACTS.whatsapp && <a className="btn block mt8 wa-btn" href={waLink('I need help now. Please contact me.')} target="_blank" rel="noopener noreferrer"><Icon n="whatsapp" size={18} />{L('Message SweetMom on WhatsApp', 'Message SweetMom for WhatsApp')}</a>}
        </section>

        <div className="k">{L('Go to hospital now if you have', 'Go hospital now if you get')}</div>
        <ul>{MUM_DANGER.map((x) => <li key={x.en}>{s.lang === 'pcm' ? x.pcm : x.en}</li>)}</ul>

        <div className="k">{L(`Or if ${bname}`, `Or if ${bname}`)}</div>
        <ul>{BABY_DANGER.map((x) => <li key={x.en}>{s.lang === 'pcm' ? x.pcm : x.en}</li>)}</ul>

        <div style={{ flex: 1, minHeight: 20 }} />
        {CONTACTS.clinic
          ? <a className="btn white block mt16" href={`tel:${CONTACTS.clinic}`} style={{ color: '#B3261E' }}><Icon n="phone" size={18} />{L('Call my clinic')}</a>
          : <p className="sm mt16" style={{ color: '#F6D6D1', textAlign: 'center' }}>{L('Clinic phone number to be added by your partner clinic.', 'Clinic number go dey added by your partner clinic.')}</p>}
        <button className="btn block mt12" style={{ background: 'transparent', border: '2px solid #FFFFFF' }} onClick={onClose}>{L('I am safe, go back', 'I dey safe, go back')}</button>
      </div>
    </div>
  );
}
