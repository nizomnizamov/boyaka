import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'uz.boyaka.app',
  appName: 'Boyaka',
  webDir: 'dist',
  bundledWebRuntime: false,

  // Android-specific settings
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false, // Production'da false!
  },

  plugins: {
    // Status Bar
    StatusBar: {
      style: 'Light',
      backgroundColor: '#2563EB',
      overlaysWebView: false,
    },

    // Splash Screen
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      launchFadeOutDuration: 300,
      backgroundColor: '#F5F5F7',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      iosSpinnerStyle: 'small',
      spinnerColor: '#2563EB',
    },

    // Keyboard
    Keyboard: {
      resize: 'body',
      style: 'Light',
      resizeOnFullScreen: true,
    },
  },
};

export default config;
