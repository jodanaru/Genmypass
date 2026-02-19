/**
 * Shared input sanitization aligned with OWASP guidelines.
 * Strips control characters, trims whitespace and enforces length limits.
 */

const CONTROL_CHARS = /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g;

const SAFE_URL_SCHEMES = new Set(["http:", "https:", "ftp:", "mailto:"]);

export const MAX_FIELD_LENGTH = 2048;
export const MAX_TITLE_LENGTH = 256;
export const MAX_USERNAME_LENGTH = 512;
export const MAX_URL_LENGTH = 2048;
export const MAX_NOTES_LENGTH = 10_000;
export const MAX_FOLDER_NAME_LENGTH = 128;

/**
 * Sanitizes a string by removing control characters, trimming and
 * enforcing a maximum length.
 */
export function sanitize(
  str: string,
  maxLength: number = MAX_FIELD_LENGTH,
): string {
  if (typeof str !== "string") return "";
  const cleaned = str.replace(CONTROL_CHARS, "").trim();
  return cleaned.length > maxLength ? cleaned.slice(0, maxLength) : cleaned;
}

/**
 * Sanitizes a URL string. In addition to the standard sanitize pass it
 * rejects dangerous schemes (javascript:, data:, vbscript:, etc.).
 * Returns an empty string when the scheme is not in the allowlist.
 */
export function sanitizeUrl(str: string): string {
  const cleaned = sanitize(str, MAX_URL_LENGTH);
  if (!cleaned) return "";

  try {
    const url = new URL(cleaned);
    if (!SAFE_URL_SCHEMES.has(url.protocol)) return "";
  } catch {
    // Not a fully qualified URL — allow relative paths and bare domains
    // but block anything that starts with a dangerous scheme.
    const lower = cleaned.toLowerCase().replace(/\s/g, "");
    if (
      lower.startsWith("javascript:") ||
      lower.startsWith("data:") ||
      lower.startsWith("vbscript:")
    ) {
      return "";
    }
  }

  return cleaned;
}
