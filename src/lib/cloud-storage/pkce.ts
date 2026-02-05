/**
 * PKCE (RFC 7636) para OAuth 2.0. Compartido por Google Drive y Dropbox.
 */
import { randomBytes, toBase64 } from "@/lib/crypto/utils";

const CODE_VERIFIER_BYTES = 32;

export interface PKCEPair {
  verifier: string;
  challenge: string;
}

async function computeCodeChallenge(verifier: string): Promise<string> {
  const data = new TextEncoder().encode(verifier);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return toBase64(new Uint8Array(hash));
}

export async function generatePKCE(): Promise<PKCEPair> {
  const verifierBytes = randomBytes(CODE_VERIFIER_BYTES);
  const verifier = toBase64(verifierBytes);
  const challenge = await computeCodeChallenge(verifier);
  return { verifier, challenge };
}

export function generateState(): string {
  return toBase64(randomBytes(24));
}
