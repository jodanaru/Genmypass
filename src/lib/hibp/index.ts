/**
 * Have I Been Pwned (HIBP) password breach check using k-anonymity.
 * Only the first 5 characters of the SHA-1 hash are sent to the API;
 * the password never leaves the device.
 */

const API_BASE = "https://api.pwnedpasswords.com/range";
const FETCH_TIMEOUT_MS = 5000;

export interface BreachCheckResult {
  breached: boolean;
  count: number;
  /** ADR-016: set when the API request failed (network, 5xx, 429). */
  error?: true;
  status?: number;
}

const breachCache = new Map<string, BreachCheckResult>();

/**
 * Computes SHA-1 hash of a string and returns it as 40-char uppercase hex.
 */
async function sha1Hex(text: string): Promise<string> {
  const bytes = new TextEncoder().encode(text);
  const buffer = await crypto.subtle.digest("SHA-1", bytes);
  const hex = Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return hex.toUpperCase();
}

/**
 * Checks if a password has appeared in known data breaches using the HIBP API
 * with k-anonymity (only the first 5 chars of the SHA-1 hash are sent).
 *
 * @param password - The password to check (never sent to the server).
 * @returns BreachCheckResult. On network/timeout or !response.ok, returns
 *          { breached: false, count: 0, error: true, status? } for ADR-016.
 */
export async function checkPasswordBreach(
  password: string
): Promise<BreachCheckResult> {
  if (!password) {
    return { breached: false, count: 0 };
  }

  try {
    const fullHash = await sha1Hex(password);

    const cached = breachCache.get(fullHash);
    if (cached !== undefined) {
      return cached;
    }

    const prefix = fullHash.slice(0, 5);
    const suffix = fullHash.slice(5);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    const response = await fetch(`${API_BASE}/${prefix}`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      return {
        breached: false,
        count: 0,
        error: true,
        status: response.status,
      };
    }

    const text = await response.text();
    const lines = text.split(/\r?\n/);

    for (const line of lines) {
      const colonIndex = line.indexOf(":");
      if (colonIndex === -1) continue;
      const lineSuffix = line.slice(0, colonIndex).trim();
      const countStr = line.slice(colonIndex + 1).trim();
      if (lineSuffix.toUpperCase() === suffix.toUpperCase()) {
        const count = parseInt(countStr, 10) || 0;
        const result: BreachCheckResult = { breached: true, count };
        breachCache.set(fullHash, result);
        return result;
      }
    }

    const result: BreachCheckResult = { breached: false, count: 0 };
    breachCache.set(fullHash, result);
    return result;
  } catch {
    return { breached: false, count: 0, error: true };
  }
}
