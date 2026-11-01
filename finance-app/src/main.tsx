import { createRoot } from 'react-dom/client';
import { Capacitor } from '@capacitor/core';
import App from './App';
import { hasOpenModal } from './ui/modalStack';
import './styles.css';

createRoot(document.getElementById('root')!).render(<App />);

if (Capacitor.isNativePlatform()) {
  // Android: hardware back button closes sheets, then returns Home, then exits.
  void (async () => {
    const { App: CapApp } = await import('@capacitor/app');
    await CapApp.addListener('backButton', () => {
      if (hasOpenModal()) { history.back(); return; }
      const hash = window.location.hash.replace(/^#/, '') || '/home';
      if (hash.split('/').length > 2) { history.back(); return; }
      if (hash !== '/home') { window.location.replace('#/home'); return; }
      void CapApp.exitApp();
    });
    const { SplashScreen } = await import('@capacitor/splash-screen');
    await SplashScreen.hide();
  })();
} else if ('serviceWorker' in navigator && import.meta.env.PROD) {
  // Web: offline support via a service worker.
  void import('virtual:pwa-register').then(({ registerSW }) => registerSW({ immediate: true }));
}
