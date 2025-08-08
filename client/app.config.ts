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
    apiUrl: process.env.API_URL || 'http://localhost:4000',
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
};

export default appConfig;
