import 'dotenv-flow/config';
import type { ExpoConfig } from 'expo/config';

const appConfig: ExpoConfig = {
  name: process.env.APP_NAME || 'Unlock Music Learning',
  slug: 'unlock-music-learning',
  scheme: 'unlockmusic',
  version: process.env.APP_VERSION || '0.1.0',
  orientation: 'portrait',
  platforms: ['ios', 'android', 'web'],
  extra: {
    apiUrl: process.env.API_URL || 'http://Pramods-Pro-14.local:4000',
    env: process.env.NODE_ENV || 'development',
  },
  updates: {
    url: process.env.EAS_UPDATE_URL,
  },
  web: {
    bundler: 'metro',
    output: 'static',
  },
  plugins: [
    'expo-secure-store',
  ],
  ios: {
    infoPlist: {
      NSAppTransportSecurity: {
        NSAllowsArbitraryLoads: true,
              NSExceptionDomains: {
          localhost: { NSExceptionAllowsInsecureHTTPLoads: true, NSIncludesSubdomains: true },
          '127.0.0.1': { NSExceptionAllowsInsecureHTTPLoads: true, NSIncludesSubdomains: true },
          '192.168.29.207': { NSExceptionAllowsInsecureHTTPLoads: true, NSIncludesSubdomains: true },
          'Pramods-Pro-14.local': { NSExceptionAllowsInsecureHTTPLoads: true, NSIncludesSubdomains: true },
        },
      },
    },
  },
};

export default appConfig;
