// Polyfill WebCrypto (subtle.digest + getRandomValues) for React Native
// Requires native packages: react-native-get-random-values and react-native-quick-crypto
// Install them with: npm install react-native-get-random-values react-native-quick-crypto

// Import getRandomValues polyfill
import 'react-native-get-random-values';

// quick-crypto exposes a WebCrypto-compatible implementation
import quickCrypto from 'react-native-quick-crypto';

// Attach webcrypto to global if not present
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
if (typeof global.crypto === 'undefined') {
  // quickCrypto.webcrypto provides subtle + getRandomValues
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  global.crypto = quickCrypto.webcrypto;
}

export {};
