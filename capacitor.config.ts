import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.vnecalculator.app',
  appName: 'VNE Calculator',
  webDir: 'dist/calculator-coin/browser',
  plugins: {
    SplashScreen: {
    launchShowDuration: 0,  // ne pas afficher le splash
    showSpinner: false,
    androidScaleType: 'CENTER_CROP',
    backgroundColor: '#ffffff',
    launchAutoHide: true
  }
  }
};

export default config;
