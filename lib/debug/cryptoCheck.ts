// runtime crypto subtle.digest check
export async function checkSubtleDigest(): Promise<void> {
  try {
    console.debug(
      '[cryptoCheck] global.crypto present=',
      typeof (global as any).crypto !== 'undefined'
    );
    // Attempt a simple digest
    // TextEncoder is available in modern JS runtimes; if not, this will throw
    // @ts-ignore
    const data = new TextEncoder().encode('test');
    // @ts-ignore
    const digest = await (global as any).crypto.subtle.digest('SHA-256', data);
    console.debug(
      '[cryptoCheck] subtle.digest OK, byteLength=',
      digest?.byteLength ?? null
    );
  } catch (err) {
    console.debug('[cryptoCheck] subtle.digest unavailable or errored:', err);
  }
}

export default checkSubtleDigest;
