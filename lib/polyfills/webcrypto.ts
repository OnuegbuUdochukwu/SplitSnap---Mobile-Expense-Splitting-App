// Polyfill WebCrypto (subtle.digest + getRandomValues) for React Native
// Requires native packages: react-native-get-random-values and react-native-quick-crypto
// Install them with: npm install react-native-get-random-values react-native-quick-crypto

// Import getRandomValues polyfill
import 'react-native-get-random-values';

// quick-crypto exposes a WebCrypto-compatible implementation
import quickCrypto from 'react-native-quick-crypto';

// Attach webcrypto to global if not present
// @ts-ignore
if (typeof global.crypto === 'undefined') {
  // quickCrypto.webcrypto provides subtle + getRandomValues
  // @ts-ignore
  global.crypto = quickCrypto.webcrypto;
  try {
    console.debug(
      '[polyfill:webcrypto] attached quick-crypto webcrypto to global.crypto'
    );
  } catch {
    // ignore
  }
} else {
  // global.crypto exists (maybe provided by another polyfill) but may lack subtle.digest.
  try {
    const hasSubtle =
      !!(global as any).crypto?.subtle &&
      typeof (global as any).crypto.subtle.digest === 'function';
    if (!hasSubtle && quickCrypto?.webcrypto?.subtle) {
      // Attach the quick-crypto subtle implementation while preserving other crypto properties
      // @ts-ignore
      (global as any).crypto.subtle = quickCrypto.webcrypto.subtle;
      console.debug(
        '[polyfill:webcrypto] patched global.crypto.subtle from quick-crypto'
      );
    } else {
      console.debug(
        '[polyfill:webcrypto] global.crypto already has subtle.digest'
      );
    }
  } catch {
    // ignore any errors here
  }
}

export {};
