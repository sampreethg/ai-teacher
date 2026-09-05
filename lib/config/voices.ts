export interface VoiceConfig {
  id: string;
  name: string;
  language: string;
  locale: string;
  nativeName: string;
}

export const SUPPORTED_LANGUAGES: Record<string, VoiceConfig> = {
  'en-GB': {
    id: 'e6988290a50641979b9ae8f176161403', // Standard British English
    name: 'English (United Kingdom)',
    language: 'English',
    locale: 'en-GB',
    nativeName: 'English (UK)',
  },
  'en-US': {
    id: '131a436c74064f70821304a0725164d8', // Standard American English
    name: 'English (United States)',
    language: 'English',
    locale: 'en-US',
    nativeName: 'English (US)',
  },
  'hi': {
    id: 'd9bcda5ec6324d55b85a3a7138b0d453', // Hindi High Quality
    name: 'Hindi (हिन्दी)',
    language: 'Hindi',
    locale: 'hi-IN',
    nativeName: 'हिन्दी',
  },
  'hinglish': {
    id: 'f941f1963fc44f76941d8e17ddb06883', // Hinglish Conversational
    name: 'Hinglish (Hindi + English)',
    language: 'Hinglish',
    locale: 'en-IN',
    nativeName: 'Hinglish',
  },
  'ta': {
    id: '9ac1ec3aa666497eb618b76c0260ebcf', // Tamil Natural
    name: 'Tamil (தமிழ்)',
    language: 'Tamil',
    locale: 'ta-IN',
    nativeName: 'தமிழ்',
  },
  'te': {
    id: '8bb5361288ef4b47a98db8d9ea987d60', // Telugu Expressive
    name: 'Telugu (తెలుగు)',
    language: 'Telugu',
    locale: 'te-IN',
    nativeName: 'తెలుగు',
  },
  'kn': {
    id: '7b700f1c305a4175b0f590141bb0baea', // Kannada Standard
    name: 'Kannada (ಕನ್ನಡ)',
    language: 'Kannada',
    locale: 'kn-IN',
    nativeName: 'ಕನ್ನಡ',
  },
  'es': {
    id: '26b2064088674c80b1e5fc536551b94e', // Spanish Standard
    name: 'Spanish (Español)',
    language: 'Spanish',
    locale: 'es-ES',
    nativeName: 'Español',
  },
  'fr': {
    id: '077ab11b14f04ce0b49b5f67b1b30fed', // French Expressive
    name: 'French (Français)',
    language: 'French',
    locale: 'fr-FR',
    nativeName: 'Français',
  },
  'de': {
    id: '3f6c8d32ec0b4e0586e902b453ec9e47', // German Standard
    name: 'German (Deutsch)',
    language: 'German',
    locale: 'de-DE',
    nativeName: 'Deutsch',
  },
};

export function getVoiceByLanguage(langKey: string): VoiceConfig {
  return SUPPORTED_LANGUAGES[langKey] || SUPPORTED_LANGUAGES['en-US'];
}
