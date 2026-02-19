const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const DROPBOX_TOKEN_URL = "https://api.dropboxapi.com/oauth2/token";

interface Env {
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  DROPBOX_CLIENT_ID: string;
  DROPBOX_CLIENT_SECRET: string;
  ALLOWED_ORIGINS?: string;
}

const DEFAULT_ALLOWED_ORIGINS = new Set([
  "https://genmypass.app",
  "http://localhost:5173",
]);

function getAllowedOrigins(env: Env): Set<string> {
  if (env.ALLOWED_ORIGINS) {
    return new Set(env.ALLOWED_ORIGINS.split(",").map((o) => o.trim()));
  }
  return DEFAULT_ALLOWED_ORIGINS;
}

function corsHeaders(origin: string) {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
  };
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const origin = request.headers.get("Origin");
    const allowed = getAllowedOrigins(env);

    // Requests without Origin (same-origin / server-side proxy) are allowed.
    // Cross-origin requests must come from an allowed origin.
    if (origin !== null && !allowed.has(origin)) {
      return new Response("Forbidden", { status: 403 });
    }

    const corsOrigin = origin ?? "";

    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(corsOrigin),
      });
    }

    const url = new URL(request.url);

    // POST /api/auth/token - Intercambiar code por tokens
    if (url.pathname === "/api/auth/token" && request.method === "POST") {
      try {
        const body = await request.json() as {
          code?: string;
          code_verifier?: string;
          redirect_uri?: string;
        };

        if (!body.code || !body.code_verifier || !body.redirect_uri) {
          return new Response(
            JSON.stringify({ error: "missing_params", message: "Faltan code, code_verifier o redirect_uri" }),
            { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders(corsOrigin) } }
          );
        }

        const tokenBody = new URLSearchParams({
          client_id: env.GOOGLE_CLIENT_ID,
          client_secret: env.GOOGLE_CLIENT_SECRET,
          code: body.code,
          code_verifier: body.code_verifier,
          grant_type: "authorization_code",
          redirect_uri: body.redirect_uri,
        });

        const response = await fetch(GOOGLE_TOKEN_URL, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: tokenBody.toString(),
        });

        const data = await response.json();

        if (!response.ok) {
          return new Response(
            JSON.stringify({
              error: data.error || "token_request_failed",
              error_description: data.error_description,
            }),
            { status: response.status, headers: { "Content-Type": "application/json", ...corsHeaders(corsOrigin) } }
          );
        }

        return new Response(JSON.stringify(data), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders(corsOrigin) },
        });
      } catch (err) {
        return new Response(
          JSON.stringify({ error: "internal_error", message: "Error en el servidor" }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders(corsOrigin) } }
        );
      }
    }

    // POST /api/auth/refresh - Renovar access token
    if (url.pathname === "/api/auth/refresh" && request.method === "POST") {
      try {
        const body = await request.json() as { refresh_token?: string };

        if (!body.refresh_token) {
          return new Response(
            JSON.stringify({ error: "missing_params", message: "Falta refresh_token" }),
            { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders(corsOrigin) } }
          );
        }

        const tokenBody = new URLSearchParams({
          client_id: env.GOOGLE_CLIENT_ID,
          client_secret: env.GOOGLE_CLIENT_SECRET,
          refresh_token: body.refresh_token,
          grant_type: "refresh_token",
        });

        const response = await fetch(GOOGLE_TOKEN_URL, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: tokenBody.toString(),
        });

        const data = await response.json();

        if (!response.ok) {
          return new Response(
            JSON.stringify({
              error: data.error || "refresh_failed",
              error_description: data.error_description,
            }),
            { status: response.status, headers: { "Content-Type": "application/json", ...corsHeaders(corsOrigin) } }
          );
        }

        // Google devuelve access_token, expires_in, token_type (no incluye refresh_token de nuevo)
        return new Response(JSON.stringify(data), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders(corsOrigin) },
        });
      } catch (err) {
        return new Response(
          JSON.stringify({ error: "internal_error", message: "Error en el servidor" }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders(corsOrigin) } }
        );
      }
    }

    // POST /api/auth/dropbox/token - Intercambiar code por tokens (Dropbox)
    // Dropbox recomienda/acepta Basic Auth (app key : app secret) para evitar invalid_client
    if (url.pathname === "/api/auth/dropbox/token" && request.method === "POST") {
      try {
        const body = await request.json() as {
          code?: string;
          code_verifier?: string;
          redirect_uri?: string;
        };

        if (!body.code || !body.code_verifier || !body.redirect_uri) {
          return new Response(
            JSON.stringify({ error: "missing_params", message: "Faltan code, code_verifier o redirect_uri" }),
            { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders(corsOrigin) } }
          );
        }

        const dropboxBasicAuth = btoa(`${env.DROPBOX_CLIENT_ID}:${env.DROPBOX_CLIENT_SECRET}`);

        const tokenBody = new URLSearchParams({
          code: body.code,
          code_verifier: body.code_verifier,
          grant_type: "authorization_code",
          redirect_uri: body.redirect_uri,
        });

        const response = await fetch(DROPBOX_TOKEN_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Authorization": `Basic ${dropboxBasicAuth}`,
          },
          body: tokenBody.toString(),
        });

        const text = await response.text();
        const data = text ? (JSON.parse(text) as { error?: string; error_description?: string }) : {};

        if (!response.ok) {
          return new Response(
            JSON.stringify({
              error: data.error || "token_request_failed",
              error_description: data.error_description,
            }),
            { status: response.status, headers: { "Content-Type": "application/json", ...corsHeaders(corsOrigin) } }
          );
        }

        return new Response(text, {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders(corsOrigin) },
        });
      } catch (err) {
        return new Response(
          JSON.stringify({ error: "internal_error", message: "Error en el servidor" }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders(corsOrigin) } }
        );
      }
    }

    // POST /api/auth/dropbox/refresh - Renovar access token (Dropbox)
    if (url.pathname === "/api/auth/dropbox/refresh" && request.method === "POST") {
      try {
        const body = await request.json() as { refresh_token?: string };

        if (!body.refresh_token) {
          return new Response(
            JSON.stringify({ error: "missing_params", message: "Falta refresh_token" }),
            { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders(corsOrigin) } }
          );
        }

        const dropboxBasicAuth = btoa(`${env.DROPBOX_CLIENT_ID}:${env.DROPBOX_CLIENT_SECRET}`);

        const tokenBody = new URLSearchParams({
          refresh_token: body.refresh_token,
          grant_type: "refresh_token",
        });

        const response = await fetch(DROPBOX_TOKEN_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Authorization": `Basic ${dropboxBasicAuth}`,
          },
          body: tokenBody.toString(),
        });

        const text = await response.text();
        const data = text ? (JSON.parse(text) as { error?: string; error_description?: string }) : {};

        if (!response.ok) {
          return new Response(
            JSON.stringify({
              error: data.error || "refresh_failed",
              error_description: data.error_description,
            }),
            { status: response.status, headers: { "Content-Type": "application/json", ...corsHeaders(corsOrigin) } }
          );
        }

        return new Response(text, {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders(corsOrigin) },
        });
      } catch (err) {
        return new Response(
          JSON.stringify({ error: "internal_error", message: "Error en el servidor" }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders(corsOrigin) } }
        );
      }
    }

    return new Response("Not Found", { status: 404 });
  },
};