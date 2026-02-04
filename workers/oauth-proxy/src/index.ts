const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

interface Env {
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
}

function corsHeaders(origin: string) {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const origin = request.headers.get("Origin") || "*";

    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(origin),
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
            { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders(origin) } }
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
            { status: response.status, headers: { "Content-Type": "application/json", ...corsHeaders(origin) } }
          );
        }

        return new Response(JSON.stringify(data), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
        });
      } catch (err) {
        return new Response(
          JSON.stringify({ error: "internal_error", message: "Error en el servidor" }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders(origin) } }
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
            { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders(origin) } }
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
            { status: response.status, headers: { "Content-Type": "application/json", ...corsHeaders(origin) } }
          );
        }

        // Google devuelve access_token, expires_in, token_type (no incluye refresh_token de nuevo)
        return new Response(JSON.stringify(data), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
        });
      } catch (err) {
        return new Response(
          JSON.stringify({ error: "internal_error", message: "Error en el servidor" }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders(origin) } }
        );
      }
    }

    return new Response("Not Found", { status: 404 });
  },
};