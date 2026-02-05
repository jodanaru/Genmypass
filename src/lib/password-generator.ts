const UPPERCASE = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const LOWERCASE = "abcdefghijklmnopqrstuvwxyz";
const NUMBERS = "0123456789";
const SYMBOLS = "!@#$%^&*()_+-=[]{}|;:,.<>?";
const AMBIGUOUS = "0O1lI";

export const LENGTH_MIN = 8;
export const LENGTH_MAX = 64;

export interface GeneratePasswordOptions {
  length: number;
  includeUppercase: boolean;
  includeLowercase: boolean;
  includeNumbers: boolean;
  includeSymbols: boolean;
  excludeAmbiguousCharacters?: boolean;
  allowDuplicateCharacters?: boolean;
}

function getCharacterSet(options: GeneratePasswordOptions): string {
  let set = "";
  if (options.includeUppercase) set += UPPERCASE;
  if (options.includeLowercase) set += LOWERCASE;
  if (options.includeNumbers) set += NUMBERS;
  if (options.includeSymbols) set += SYMBOLS;
  if (options.excludeAmbiguousCharacters && set.length > 0) {
    set = set.split("").filter((c) => !AMBIGUOUS.includes(c)).join("");
  }
  return set;
}

/** Fisher–Yates shuffle; one crypto.getRandomValues call. */
function shuffleInPlace<T>(arr: T[]): void {
  if (arr.length <= 1) return;
  const numSwaps = arr.length - 1;
  const bytes = new Uint8Array(numSwaps * 2);
  crypto.getRandomValues(bytes);
  for (let i = arr.length - 1; i > 0; i--) {
    const k = (arr.length - 1 - i) * 2;
    const j = (bytes[k]! * 256 + bytes[k + 1]!) % (i + 1);
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
  }
}

/**
 * Generates a cryptographically random password.
 * Requires at least one character set to be enabled. Length clamped to 8–64.
 * When allowDuplicateCharacters is false, uses shuffle (no retry loop).
 */
export function generatePassword(options: GeneratePasswordOptions): string {
  const requestedLength = Math.min(LENGTH_MAX, Math.max(LENGTH_MIN, options.length));
  const fullSet = getCharacterSet(options);

  if (fullSet.length === 0) {
    throw new Error("At least one character set must be enabled");
  }

  const allowDuplicate = options.allowDuplicateCharacters ?? true;

  if (!allowDuplicate) {
    const maxLength = Math.min(requestedLength, fullSet.length);
    const chars = fullSet.split("");
    shuffleInPlace(chars);
    return chars.slice(0, maxLength).join("");
  }

  const bytes = new Uint8Array(requestedLength * 2);
  crypto.getRandomValues(bytes);

  let result = "";
  for (let i = 0; i < requestedLength; i++) {
    const idx = (bytes[i * 2]! * 256 + bytes[i * 2 + 1]!) % fullSet.length;
    result += fullSet[idx]!;
  }
  return result;
}

export type StrengthLevel = "weak" | "fair" | "good" | "excellent";

export interface PasswordStrength {
  level: StrengthLevel;
  bars: number;
  label: string;
}

/** Tailwind class for strength meter bar fill (1–4 bars). */
export function getStrengthBarColorClass(strength: PasswordStrength): string {
  switch (strength.level) {
    case "excellent":
      return "bg-green-500";
    case "good":
      return "bg-green-400";
    case "fair":
      return "bg-amber-500";
    case "weak":
    default:
      return "bg-red-400";
  }
}

/** Tailwind class for strength label text. */
export function getStrengthTextColorClass(strength: PasswordStrength): string {
  switch (strength.level) {
    case "excellent":
      return "text-green-600 dark:text-green-400";
    case "good":
      return "text-green-600 dark:text-green-400";
    case "fair":
      return "text-amber-600 dark:text-amber-400";
    case "weak":
    default:
      return "text-red-600 dark:text-red-400";
  }
}

/**
 * Estimates password strength from length and character diversity.
 * Returns level, number of bars (1–4), and display label.
 */
export function getPasswordStrength(password: string): PasswordStrength {
  if (!password.length) {
    return { level: "weak", bars: 1, label: "Weak" };
  }

  let hasUpper = false;
  let hasLower = false;
  let hasNumber = false;
  let hasSymbol = false;
  for (const c of password) {
    if (UPPERCASE.includes(c)) hasUpper = true;
    else if (LOWERCASE.includes(c)) hasLower = true;
    else if (NUMBERS.includes(c)) hasNumber = true;
    else if (SYMBOLS.includes(c)) hasSymbol = true;
  }

  const diversity = [hasUpper, hasLower, hasNumber, hasSymbol].filter(Boolean).length;
  const len = password.length;

  if (len >= 16 && diversity >= 4) {
    return { level: "excellent", bars: 4, label: "Excellent Strength" };
  }
  if (len >= 12 && diversity >= 3) {
    return { level: "good", bars: 3, label: "Good Strength" };
  }
  if (len >= 10 || diversity >= 2) {
    return { level: "fair", bars: 2, label: "Fair Strength" };
  }
  return { level: "weak", bars: 1, label: "Weak" };
}
