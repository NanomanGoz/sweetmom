import { useEffect, useState } from 'react';
import { initVoice, initPhotos } from './platform';
import { Team } from './screens/Team';
import { useStore } from './store';
import { TabBar, AskFab, type Tab } from './components';
import { Welcome } from './screens/Welcome';
import { Home, type Go } from './screens/Home';
import { Checkin } from './screens/Checkin';
import { Baby } from './screens/Baby';
import { Circle } from './screens/Circle';
import { Doctor } from './screens/Doctor';
import { Voice } from './screens/Voice';
import { Me } from './screens/Me';
import { Help } from './screens/Help';
import { Journey } from './screens/Journey';
import { Learn, Article } from './screens/Learn';
import { Epds } from './screens/Epds';
import { CONTACTS } from './config/contacts';
import { ARTICLE_BY_ID } from './content/learn';

type Flow = null | 'checkin' | 'epds' | 'voice' | 'guide' | 'journey' | 'doctor' | 'team' | { article: string };

export function App() {
  const { s } = useStore();
  const [tab, setTab] = useState<Tab>('home');
  const [flow, setFlow] = useState<Flow>(null);
  const [babyTab, setBabyTab] = useState<'week' | 'vaccines' | null>(null);
  const [prefill, setPrefill] = useState<string | undefined>();
  const [help, setHelp] = useState(false);
  const top = () => window.scrollTo(0, 0);
  useEffect(() => { initVoice(); initPhotos(); }, []);

  const go: Go = (t) => {
    top();
    if (t === 'help') return setHelp(true);
    if (t === 'whatsapp') { if (CONTACTS.circleGroup) window.open(CONTACTS.circleGroup, '_blank', 'noopener'); else { setFlow(null); setTab('circle'); } return; }
    if (t === 'vaccines') { setFlow(null); setBabyTab('vaccines'); setTab('baby'); return; }
    if (typeof t === 'string' && t.startsWith('article:')) return setFlow({ article: t.slice(8) });
    if (t === 'checkin' || t === 'epds' || t === 'journey' || t === 'doctor') { setPrefill(undefined); return setFlow(t); }
    setFlow(null); setTab(t as Tab);
  };
  const helpLayer = help && <Help onClose={() => setHelp(false)} />;
  const wrap = (node: React.ReactNode) => <div className="app">{node}{helpLayer}</div>;

  if (!s.mother || !s.baby || !s.consent) return wrap(<Welcome onDone={() => setTab('home')} />);
  if (flow === 'guide') return wrap(<Welcome guideOnly onDone={() => setFlow(null)} />);
  if (flow === 'checkin') return wrap(<Checkin onClose={(to) => { setFlow(to === 'doctor' ? 'doctor' : null); top(); }} onCrisis={() => { setFlow(null); setHelp(true); }} />);
  if (flow === 'epds') return wrap(<Epds onClose={() => setFlow(null)} onCrisis={() => { setFlow(null); setHelp(true); }} onCheckin={() => setFlow('checkin')} onTalk={() => setFlow('doctor')} />);
  if (flow === 'voice') return wrap(<Voice onClose={() => setFlow(null)} onType={() => setFlow('doctor')} onHelp={() => { setFlow(null); setHelp(true); }} />);
  if (flow === 'team') return wrap(<Team onClose={() => setFlow(null)} />);
  if (flow === 'journey') return wrap(<Journey onClose={() => setFlow(null)} go={go} />);
  if (flow === 'doctor') return wrap(<Doctor prefill={prefill} onClose={() => setFlow(null)} onHelp={() => setHelp(true)} onVoice={() => setFlow('voice')} />);
  if (flow && typeof flow === 'object') return wrap(<Article id={flow.article} onClose={() => setFlow(null)} onAsk={() => { setPrefill(`About "${ARTICLE_BY_ID[flow.article]?.title}": `); setFlow('doctor'); }} />);

  return wrap(
    <>
      {tab === 'home' && <Home go={go} />}
      {tab === 'baby' && <Baby onHelp={() => setHelp(true)} initialTab={babyTab ?? undefined} key={babyTab ?? 'b'} />}
      {tab === 'circle' && <Circle onHelp={() => setHelp(true)} />}
      {tab === 'learn' && <Learn open={(id) => { top(); setFlow({ article: id }); }} />}
      {tab === 'me' && <Me go={go} onHelp={() => setHelp(true)} onCheckin={() => setFlow('checkin')} onGuide={() => setFlow('guide')} onTeam={() => { top(); setFlow('team'); }} />}
      {tab !== 'circle' && <AskFab onClick={() => go('doctor')} />}
      <TabBar tab={tab} go={(t) => { setBabyTab(null); go(t); }} />
    </>
  );
}
