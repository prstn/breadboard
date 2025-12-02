import LZ from 'lz-string';

export interface BreadboardState {
  text: string;
  positions?: Record<string, { x: number; y: number }>;
  hasManualLayout?: boolean;
}

/**
 * Encodes state to a URL-safe Base64 string using LZ compression
 */
export function encodeStateToUrl(state: BreadboardState): string {
  const json = JSON.stringify(state);
  return LZ.compressToBase64(json);
}

/**
 * Decodes a URL hash string back to state object
 * Returns null if decoding fails
 * Handles backward compatibility with old text-only format
 */
export function decodeStateFromUrl(hash: string): BreadboardState | null {
  try {
    const decoded = LZ.decompressFromBase64(hash);
    if (!decoded) return null;

    // Try parsing as JSON (new format)
    try {
      const state = JSON.parse(decoded) as BreadboardState;
      // Validate it has at least a text property
      if (typeof state.text === 'string') {
        return state;
      }
    } catch {
      // If JSON parse fails, treat as old format (plain text)
      return { text: decoded };
    }

    return null;
  } catch (error) {
    console.warn('Failed to decode URL hash:', error);
    return null;
  }
}

/**
 * Gets initial state from URL hash on page load
 * Falls back to defaultText if no hash or decode fails
 */
export function getInitialStateFromUrl(defaultText: string): BreadboardState {
  // Read hash from URL (without the # prefix)
  const hash = window.location.hash.slice(1);

  if (!hash) {
    return { text: defaultText };
  }

  // Try to decode
  const decoded = decodeStateFromUrl(hash);
  return decoded || { text: defaultText };
}

/**
 * Updates the URL hash with encoded state
 * Uses replaceState to avoid polluting browser history
 */
export function updateUrlState(state: BreadboardState): void {
  const encoded = encodeStateToUrl(state);
  const newUrl = `${window.location.pathname}#${encoded}`;

  // Use replaceState to avoid adding history entries
  window.history.replaceState(null, '', newUrl);
}

// Legacy exports for backward compatibility
export const encodeTextToUrl = (text: string) => encodeStateToUrl({ text });
export const decodeTextFromUrl = (hash: string) => decodeStateFromUrl(hash)?.text || null;
export const getInitialTextFromUrl = (defaultText: string) => getInitialStateFromUrl(defaultText).text;
export const updateUrlHash = (text: string) => updateUrlState({ text });
