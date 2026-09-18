// Learn more: https://docs.expo.dev/guides/environment-variables/
const { SUPABASE_URL, SUPABASE_ANON_KEY } = process.env;

export default {
  expo: {
    name: 'HAMA',
    slug: 'hama',
    version: '2.1.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'dark',
    scheme: 'hama',
    splash: {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#0A0A0F',
    },
    assetBundlePatterns: ['**/*'],

    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.hama.app',
      infoPlist: {
        NSFaceIDUsageDescription: 'HAMA uses Face ID to securely authenticate you.',
        NSMicrophoneUsageDescription:
          'HAMA needs microphone access so you can send voice messages to landlords, sellers and movers.',
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#0A0A0F',
      },
      package: 'com.hama.app',
      permissions: ['RECORD_AUDIO'],
    },
    web: {
      bundler: 'metro',
      output: 'single',
      favicon: './assets/icon.png',
      meta: {
        viewport: 'width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover',
      },
    },
    plugins: [
      'expo-router',
      'expo-secure-store',
      'expo-font',
      [
        'expo-image-picker',
        {
          photosPermission: 'Allow HAMA to access your photos so you can set a profile picture.',
          cameraPermission: 'Allow HAMA to access your camera so you can take a profile picture.',
          microphonePermission: false,
        },
      ],
      [
        'expo-notifications',
        {
          icon: './assets/icon.png',
          color: '#FF6B00',
        },
      ],
      [
        'expo-audio',
        {
          microphonePermission:
            'HAMA needs microphone access so you can send voice messages to landlords, sellers and movers.',
        },
      ],
    ],
    extra: {
      supabaseUrl: SUPABASE_URL,
      supabaseAnonKey: SUPABASE_ANON_KEY,
      // Set after running `eas init` (or paste your EAS project ID here).
      // Required for Expo push tokens in standalone/dev builds.
      eas: {
        projectId: process.env.EAS_PROJECT_ID ?? 'YOUR_EAS_PROJECT_ID',
      },
    },
  },
};
