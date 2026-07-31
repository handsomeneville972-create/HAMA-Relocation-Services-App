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
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#0A0A0F',
      },
      package: 'com.hama.app',
    },
    web: {
      bundler: 'metro',
      output: 'single',
      favicon: './assets/icon.png',
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
    ],
    extra: {
      supabaseUrl: SUPABASE_URL,
      supabaseAnonKey: SUPABASE_ANON_KEY,
    },
  },
};
