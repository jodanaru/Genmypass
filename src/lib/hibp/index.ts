/**
 * Have I Been Pwned (HIBP) password breach check using k-anonymity.
 * Only the first 5 characters of the SHA-1 hash are sent to the API;
 * the password never leaves the device.
 */

const API_BASE = "https://api.pwnedpasswords.com/range";
const FETCH_TIMEOUT_MS = 5000;

const breachCache = new Map<string, { breached: boolean; count: number }>();

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
 * @returns { breached: true, count } if found in breaches, else { breached: false, count: 0 }.
 *          On network/timeout errors, returns { breached: false, count: 0 } (does not throw).
 */
export async function checkPasswordBreach(
  password: string
): Promise<{ breached: boolean; count: number }> {
  if (!password) {
    return { breached: false, count: 0 };
  }

  const cached = breachCache.get(password);
  if (cached !== undefined) {
    return cached;
  }

  try {
    const fullHash = await sha1Hex(password);
    const prefix = fullHash.slice(0, 5);
    const suffix = fullHash.slice(5);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    const response = await fetch(`${API_BASE}/${prefix}`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn("[HIBP] API returned non-OK:", response.status);
      return { breached: false, count: 0 };
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
        const result = { breached: true, count };
        breachCache.set(password, result);
        return result;
      }
    }

    const result = { breached: false, count: 0 };
    breachCache.set(password, result);
    return result;
  } catch (err) {
    console.warn("[HIBP] Breach check failed:", err);
    return { breached: false, count: 0 };
  }
}
