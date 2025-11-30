import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.bonakshop.app',
  appName: 'BonakShop',
  webDir: 'public',
  server: {
    androidScheme: 'https',
    // To test on a real device/emulator while developing locally:
    // url: 'http://192.168.1.x:3000', 
    // For production:
    // url: 'https://your-production-url.com',
    cleartext: true
  }
};

export default config;
