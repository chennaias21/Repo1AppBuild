import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.rupeeroutine.app',
  appName: 'Rupee Routine',
  webDir: 'dist',
  android: { allowMixedContent: false },
  plugins: {
    SplashScreen: { launchShowDuration: 1200, launchAutoHide: true, backgroundColor: '#0a0a0f', androidScaleType: 'CENTER_CROP', showSpinner: false },
    StatusBar: { style: 'DEFAULT' },
  },
};

export default config;
