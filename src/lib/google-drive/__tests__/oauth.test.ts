import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { generatePKCE, initiateOAuthFlow, handleOAuthCallback, OAUTH_CALLBACK_PATH } from "../oauth.js";

const STORAGE_VERIFIER = "google_oauth_code_verifier";
const STORAGE_STATE = "google_oauth_state";
const SCOPE = "https://www.googleapis.com/auth/drive.appdata";
const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";

/** Verifica que una string sea base64url (A-Za-z0-9_- sin padding). */
function isBase64Url(s: string): boolean {
  return /^[A-Za-z0-9_-]+$/.test(s) && s.length >= 43;
}

describe("generatePKCE", () => {
  it("devuelve verifier y challenge", async () => {
    const { verifier, challenge } = await generatePKCE();
    expect(verifier).toBeDefined();
    expect(challenge).toBeDefined();
    expect(typeof verifier).toBe("string");
    expect(typeof challenge).toBe("string");
  });

  it("verifier tiene longitud y formato base64url (43+ caracteres)", async () => {
    const { verifier } = await generatePKCE();
    expect(verifier.length).toBeGreaterThanOrEqual(43);
    expect(verifier.length).toBeLessThanOrEqual(128);
    expect(isBase64Url(verifier)).toBe(true);
  });

  it("challenge es base64url", async () => {
    const { challenge } = await generatePKCE();
    expect(isBase64Url(challenge)).toBe(true);
  });

  it("challenge es distinto del verifier", async () => {
    const { verifier, challenge } = await generatePKCE();
    expect(challenge).not.toBe(verifier);
  });

  it("challenge es base64url(SHA-256(verifier))", async () => {
    const pair = await generatePKCE();
    const data = new TextEncoder().encode(pair.verifier);
    const hash = await crypto.subtle.digest("SHA-256", data);
    const expectedChallenge = btoa(String.fromCharCode(...new Uint8Array(hash)))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
    expect(pair.challenge).toBe(expectedChallenge);
  });
});

describe("initiateOAuthFlow", () => {
  const testClientId = "test-client-id.apps.googleusercontent.com";
  let locationHref: string;
  let originalLocation: Location;

  beforeEach(() => {
    vi.stubEnv("VITE_GOOGLE_CLIENT_ID", testClientId);
    locationHref = "";
    originalLocation = window.location;
    delete (window as unknown as { location: Location }).location;
    (window as unknown as { location: { href: string; origin: string } }).location = {
      get href() {
        return locationHref;
      },
      set href(v: string) {
        locationHref = v;
      },
      origin: "http://localhost:5173",
    };
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    (window as unknown as { location: Location }).location = originalLocation;
    sessionStorage.clear();
  });

  it("guarda verifier y state en sessionStorage", async () => {
    const verifier = "test-verifier-min-43-chars-long-for-pkce-rfc7636";
    await initiateOAuthFlow(verifier);
    expect(sessionStorage.getItem(STORAGE_VERIFIER)).toBe(verifier);
    expect(sessionStorage.getItem(STORAGE_STATE)).toBeTruthy();
    expect(sessionStorage.getItem(STORAGE_STATE)!.length).toBeGreaterThan(0);
  });

  it("redirige a Google OAuth con code_challenge, state, scope y client_id", async () => {
    const verifier = "a".repeat(43);
    await initiateOAuthFlow(verifier);
    expect(locationHref).toContain(GOOGLE_AUTH_URL);
    expect(locationHref).toContain("code_challenge=");
    expect(locationHref).toContain("code_challenge_method=S256");
    expect(locationHref).toContain("state=");
    expect(locationHref).toContain("scope=" + encodeURIComponent(SCOPE));
    expect(locationHref).toContain("client_id=" + encodeURIComponent(testClientId));
    expect(locationHref).toContain("redirect_uri=" + encodeURIComponent("http://localhost:5173" + OAUTH_CALLBACK_PATH));
    expect(locationHref).toContain("response_type=code");
  });

  it("lanza si VITE_GOOGLE_CLIENT_ID no está definida", async () => {
    vi.unstubAllEnvs();
    vi.stubEnv("VITE_GOOGLE_CLIENT_ID", undefined);
    const verifier = "a".repeat(43);
    await expect(initiateOAuthFlow(verifier)).rejects.toThrow("VITE_GOOGLE_CLIENT_ID");
  });
});

describe("handleOAuthCallback", () => {
  const testClientId = "test-client-id.apps.googleusercontent.com";
  let originalLocation: Location;
  let originalFetch: typeof fetch;

  beforeEach(() => {
    vi.stubEnv("VITE_GOOGLE_CLIENT_ID", testClientId);
    originalLocation = window.location;
    originalFetch = globalThis.fetch;
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    (window as unknown as { location: Location }).location = originalLocation;
    globalThis.fetch = originalFetch;
    sessionStorage.clear();
  });

  function setLocationSearch(search: string) {
    delete (window as unknown as { location: Location }).location;
    (window as unknown as { location: Location }).location = {
      ...originalLocation,
      search,
      origin: "http://localhost:5173",
    } as Location;
  }

  it("devuelve error si la URL tiene ?error=...", async () => {
    setLocationSearch("?error=access_denied&error_description=User%20canceled");
    const result = await handleOAuthCallback();
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("access_denied");
      expect(result.errorDescription).toContain("User canceled");
    }
  });

  it("devuelve error si falta verifier o state en sessionStorage", async () => {
    setLocationSearch("?code=abc123&state=xyz");
    const result = await handleOAuthCallback();
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBe("missing_storage");
  });

  it("devuelve error si el state no coincide", async () => {
    sessionStorage.setItem(STORAGE_VERIFIER, "verifier");
    sessionStorage.setItem(STORAGE_STATE, "correct-state");
    setLocationSearch("?code=abc123&state=wrong-state");
    const result = await handleOAuthCallback();
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBe("invalid_state");
    expect(sessionStorage.getItem(STORAGE_VERIFIER)).toBeNull();
    expect(sessionStorage.getItem(STORAGE_STATE)).toBeNull();
  });

  it("devuelve error si no hay code en la URL", async () => {
    sessionStorage.setItem(STORAGE_VERIFIER, "verifier");
    sessionStorage.setItem(STORAGE_STATE, "my-state");
    setLocationSearch("?state=my-state");
    const result = await handleOAuthCallback();
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBe("missing_code");
  });

  it("intercambia code por tokens y limpia sessionStorage", async () => {
    sessionStorage.setItem(STORAGE_VERIFIER, "my-verifier");
    sessionStorage.setItem(STORAGE_STATE, "my-state");
    setLocationSearch("?code=auth-code-123&state=my-state");

    const mockTokens = {
      access_token: "ya29.xxx",
      expires_in: 3599,
      token_type: "Bearer" as const,
      scope: SCOPE,
    };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockTokens),
    });

    const result = await handleOAuthCallback();

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.tokens.access_token).toBe("ya29.xxx");
      expect(result.tokens.token_type).toBe("Bearer");
    }
    expect(sessionStorage.getItem(STORAGE_VERIFIER)).toBeNull();
    expect(sessionStorage.getItem(STORAGE_STATE)).toBeNull();

    expect(fetch).toHaveBeenCalledWith(
      "https://oauth2.googleapis.com/token",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      })
    );
    const callBody = (fetch as ReturnType<typeof vi.fn>).mock.calls[0]![1]!.body as string;
    expect(callBody).toContain("client_id=");
    expect(callBody).toContain("code=auth-code-123");
    expect(callBody).toContain("code_verifier=my-verifier");
    expect(callBody).toContain("grant_type=authorization_code");
    expect(callBody).toContain("redirect_uri=");
  });

  it("devuelve error si el endpoint de tokens falla", async () => {
    sessionStorage.setItem(STORAGE_VERIFIER, "v");
    sessionStorage.setItem(STORAGE_STATE, "s");
    setLocationSearch("?code=bad&state=s");

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: "invalid_grant", error_description: "Bad request" }),
    });

    const result = await handleOAuthCallback();
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("invalid_grant");
      expect(result.errorDescription).toBe("Bad request");
    }
  });

  it("devuelve error si la respuesta no tiene access_token válido", async () => {
    sessionStorage.setItem(STORAGE_VERIFIER, "v");
    sessionStorage.setItem(STORAGE_STATE, "s");
    setLocationSearch("?code=x&state=s");

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ token_type: "Bearer" }), // sin access_token
    });

    const result = await handleOAuthCallback();
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBe("invalid_response");
  });
});
