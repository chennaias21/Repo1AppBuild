import { useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { BarChart3, Home as HomeIcon, Lightbulb, ListChecks, Plus, Settings as SettingsIcon, Target } from 'lucide-react';
import { loadAll, setDeviceIdCache } from './data/repo';
import { AppProvider, useApp } from './ui/app';
import { Onboarding, BRAND } from './ui/Onboarding';
import { useRoute, go, replace } from './ui/router';
import { Home } from './ui/screens/Home';
import { Transactions } from './ui/screens/Transactions';
import { Budget } from './ui/screens/Budget';
import { Goals } from './ui/screens/Goals';
import { Insights } from './ui/screens/Insights';
import { Settings } from './ui/screens/Settings';
import { isNative } from './data/files';

const TABS = [
  { path: '/home', label: 'Home', icon: HomeIcon },
  { path: '/transactions', label: 'Transactions', short: 'Activity', icon: ListChecks },
  { path: '/budget', label: 'Budget', icon: BarChart3 },
  { path: '/goals', label: 'Goals', icon: Target },
  { path: '/insights', label: 'Insights', icon: Lightbulb },
  { path: '/settings', label: 'Settings', icon: SettingsIcon },
] as const;

function Shell() {
  const route = useRoute();
  const { openSheet } = useApp();
  const [, top, sub] = route.split('/');
  const tab = '/' + (top || 'home');
  useEffect(() => { window.scrollTo(0, 0); }, [route]);

  let screen;
  switch (tab) {
    case '/transactions': screen = <Transactions />; break;
    case '/budget': screen = <Budget />; break;
    case '/goals': screen = <Goals />; break;
    case '/insights': screen = <Insights />; break;
    case '/settings': screen = <Settings sub={sub} />; break;
    default: screen = <Home />;
  }
  return (
    <div className="shell">
      <aside className="sidebar" aria-label="Main navigation">
        <div className="brand"><div className="logo">₹</div><div><b>{BRAND.name}</b><small>{BRAND.tagline}</small></div></div>
        {TABS.map((t) => (
          <button key={t.path} className={`side-item ${tab === t.path ? 'active' : ''}`} onClick={() => replace(t.path)}>
            <t.icon size={22} /><span>{t.label}</span>
          </button>
        ))}
      </aside>
      <main className="main">{screen}</main>
      <nav className="tabbar" aria-label="Main navigation">
        {TABS.map((t) => (
          <button key={t.path} className={`tab ${tab === t.path ? 'active' : ''}`} onClick={() => replace(t.path)} aria-current={tab === t.path ? 'page' : undefined}>
            <span className="ico"><t.icon size={21} /></span>{'short' in t ? t.short : t.label}
          </button>
        ))}
      </nav>
      <button className="fab" aria-label="Add transaction" onClick={() => openSheet({ kind: 'txn' })}><Plus size={30} /></button>
    </div>
  );
}

export default function App() {
  const state = useLiveQuery(async () => ({ data: await loadAll() }), []);
  const theme = state?.data?.settings.theme;
  useEffect(() => {
    const el = document.documentElement;
    if (!theme || theme === 'system') el.removeAttribute('data-theme');
    else el.setAttribute('data-theme', theme);
    if (isNative()) {
      void (async () => {
        try {
          const { StatusBar, Style } = await import('@capacitor/status-bar');
          const dark = theme === 'dark' || (theme !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches);
          await StatusBar.setStyle({ style: dark ? Style.Dark : Style.Light });
          await StatusBar.setBackgroundColor({ color: dark ? '#0a0a0f' : '#f3f4f9' });
        } catch { /* optional */ }
      })();
    }
  }, [theme]);
  useEffect(() => { if (state?.data) setDeviceIdCache(state.data.settings.deviceId); }, [state]);
  useEffect(() => { if (!window.location.hash) replace('/home'); }, []);

  if (!state) return <div className="splash"><div className="logo xl" style={{ width: 72, height: 72, fontSize: 38, borderRadius: 22 }}>₹</div></div>;
  if (!state.data) return <Onboarding />;
  return <AppProvider data={state.data}><Shell /></AppProvider>;
}
export { go };
