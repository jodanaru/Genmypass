const UPPERCASE = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const LOWERCASE = "abcdefghijklmnopqrstuvwxyz";
const NUMBERS = "0123456789";
const SYMBOLS = "!@#$%^&*()_+-=[]{}|;:,.<>?";
const AMBIGUOUS = "0O1lI";

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

/**
 * Generates a cryptographically random password.
 * Requires at least one character set to be enabled. Length clamped to 8–64.
 */
export function generatePassword(options: GeneratePasswordOptions): string {
  const length = Math.min(64, Math.max(8, options.length));
  const fullSet = getCharacterSet(options);

  if (fullSet.length === 0) {
    throw new Error("At least one character set must be enabled");
  }

  const allowDuplicate = options.allowDuplicateCharacters ?? true;
  const bytes = new Uint8Array(length * 2);
  crypto.getRandomValues(bytes);

  let result = "";
  for (let i = 0; i < length; i++) {
    const idx = (bytes[i * 2]! * 256 + bytes[i * 2 + 1]!) % fullSet.length;
    const char = fullSet[idx]!;
    if (!allowDuplicate && result.includes(char)) {
      i--;
      continue;
    }
    result += char;
  }
  return result;
}

export type StrengthLevel = "weak" | "fair" | "good" | "excellent";

export interface PasswordStrength {
  level: StrengthLevel;
  bars: number;
  label: string;
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
