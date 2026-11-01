import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.yarub.ironfront',
  appName: 'IRON FRONT',
  webDir: 'dist',
  bundledWebRuntime: false,
  android: {
    backgroundColor: '#090e13',
    allowMixedContent: false
  }
};

export default config;
