import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.workos.authdemo',
  appName: 'WorkOS Auth Demo',
  webDir: 'dist',
  server: {
    // For local development, you can set this to your machine's IP
    // url: 'http://192.168.1.100:3001',
    // cleartext: true
  }
};

export default config;
