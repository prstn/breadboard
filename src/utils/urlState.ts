import LZ from 'lz-string';

/**
 * Encodes text to a URL-safe Base64 string using LZ compression
 */
export function encodeTextToUrl(text: string): string {
  return LZ.compressToBase64(text);
}

/**
 * Decodes a URL hash string back to plain text
 * Returns null if decoding fails
 */
export function decodeTextFromUrl(hash: string): string | null {
  try {
    const decoded = LZ.decompressFromBase64(hash);
    return decoded || null;
  } catch (error) {
    console.warn('Failed to decode URL hash:', error);
    return null;
  }
}

/**
 * Gets initial text from URL hash on page load
 * Falls back to defaultText if no hash or decode fails
 */
export function getInitialTextFromUrl(defaultText: string): string {
  // Read hash from URL (without the # prefix)
  const hash = window.location.hash.slice(1);

  if (!hash) {
    return defaultText;
  }

  // Try to decode
  const decoded = decodeTextFromUrl(hash);
  return decoded || defaultText;
}

/**
 * Updates the URL hash with encoded text
 * Uses replaceState to avoid polluting browser history
 */
export function updateUrlHash(text: string): void {
  const encoded = encodeTextToUrl(text);
  const newUrl = `${window.location.pathname}#${encoded}`;

  // Use replaceState to avoid adding history entries
  window.history.replaceState(null, '', newUrl);
}
