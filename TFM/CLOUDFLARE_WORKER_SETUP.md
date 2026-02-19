# Cloudflare Worker - Proxy OAuth para Genmypass

Este documento describe el proceso de creación e implementación del Cloudflare Worker que actúa como proxy OAuth para el proyecto Genmypass. Forma parte de la documentación del Trabajo Fin de Máster.

## 1. Contexto y motivación

### Por qué es necesario

El flujo OAuth 2.0 con Google requiere intercambiar el *authorization code* por tokens en el endpoint `https://oauth2.googleapis.com/token`. Esta petición debe incluir:

- `client_id` (público, puede estar en el frontend)
- `client_secret` (confidencial, **nunca** debe exponerse en el cliente)
- `code`, `code_verifier`, `redirect_uri`, `grant_type`

En una SPA (Single Page Application), todo el código se ejecuta en el navegador. Si el frontend llamara directamente a Google con el `client_secret`, cualquier usuario podría inspeccionarlo en las DevTools → **violación de seguridad crítica**.

### Decisión arquitectónica (ADR-003)

El [ADR-003](ADR.md#adr-003-arquitectura-serverless-con-cloudflare-workers) establece:

> **Cloudflare Workers** - 2 funciones para OAuth proxy:
> - `POST /api/auth/token` - Intercambiar code por tokens
> - `POST /api/auth/refresh` - Renovar access tokens
>
> **Client secret protegido**

El Worker actúa como intermediario: recibe del frontend solo los datos seguros (`code`, `code_verifier`), añade el `client_secret` en el servidor, y reenvía la petición al proveedor (Google o Dropbox). Los tokens nunca pasan por el Worker de forma persistente; se devuelven directamente al cliente.

El mismo Worker expone endpoints para **Google** y para **Dropbox**:

| Ruta | Método | Proveedor | Descripción |
|------|--------|-----------|-------------|
| `/api/auth/token` | POST | Google | Intercambiar code por tokens |
| `/api/auth/refresh` | POST | Google | Renovar access token |
| `/api/auth/dropbox/token` | POST | Dropbox | Intercambiar code por tokens |
| `/api/auth/dropbox/refresh` | POST | Dropbox | Renovar access token |

Dropbox exige enviar credenciales con **Basic Auth** (App key : App secret) en lugar de en el body; el Worker implementa eso y mantiene el secret en el servidor.

### Flujo simplificado (Google)

```
[Frontend]                    [Cloudflare Worker]              [Google]
    |                                  |                           |
    |  POST /api/auth/token            |                           |
    |  { code, code_verifier }         |                           |
    | --------------------------------->                           |
    |                                  |  POST oauth2.googleapis   |
    |                                  |  + client_secret          |
    |                                  | ------------------------->|
    |                                  |                           |
    |                                  |  { access_token, ... }    |
    |  { access_token, refresh_token } | <-------------------------|
    | <---------------------------------                           |
```

---

## 2. Requisitos previos

- Cuenta en [Cloudflare](https://dash.cloudflare.com)
- Proyecto Genmypass con OAuth configurado:
  - **Google**: [GOOGLE_OAUTH_SETUP.md](GOOGLE_OAUTH_SETUP.md)
  - **Dropbox**: [DROPBOX_OAUTH_SETUP.md](DROPBOX_OAUTH_SETUP.md)
- Node.js 18+ y pnpm (o npm)
- Wrangler CLI de Cloudflare

---

## 3. Instalación de Wrangler

Wrangler es la herramienta oficial para desarrollar y desplegar Workers.

```bash
pnpm add -D wrangler
```

O globalmente:

```bash
npm install -g wrangler
```

Verifica la instalación:

```bash
npx wrangler --version
```

---

## 4. Crear el proyecto del Worker

### 4.1 Inicializar Worker

En la raíz del proyecto Genmypass (o en un subdirectorio `workers/`):

```bash
mkdir -p workers && cd workers
npx wrangler init oauth-proxy
```

Selecciona:
- **Would you like to use TypeScript?** Yes
- **Would you like to use git?** No (el repo ya está en git)
- **Would you like to deploy?** No (primero configurar)

### 4.2 Estructura del proyecto

```
workers/oauth-proxy/
├── src/
│   └── index.ts      # Código del Worker
├── wrangler.toml     # Configuración de Wrangler
└── package.json
```

---

## 5. Implementación del Worker

### 5.1 wrangler.toml

```toml
name = "genmypass-oauth-proxy"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[vars]
# No poner secrets aquí

# Secrets (Google):
#   wrangler secret put GOOGLE_CLIENT_ID
#   wrangler secret put GOOGLE_CLIENT_SECRET
# Secrets (Dropbox):
#   wrangler secret put DROPBOX_CLIENT_ID
#   wrangler secret put DROPBOX_CLIENT_SECRET
```

### 5.2 src/index.ts

```typescript
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
```

---

## 6. Configurar secrets

Los valores sensibles se configuran como **secrets** en Cloudflare (no en wrangler.toml).

### Google

```bash
cd workers/oauth-proxy
npx wrangler secret put GOOGLE_CLIENT_ID
npx wrangler secret put GOOGLE_CLIENT_SECRET
```

En cada comando, Wrangler pedirá el valor por stdin. Usa el Client ID y Client Secret de [Google Cloud Console](GOOGLE_OAUTH_SETUP.md#5-obtener-y-configurar-credenciales).

### Dropbox

```bash
npx wrangler secret put DROPBOX_CLIENT_ID
npx wrangler secret put DROPBOX_CLIENT_SECRET
```

Usa la **App key** como `DROPBOX_CLIENT_ID` y el **App secret** como `DROPBOX_CLIENT_SECRET` (creados en [Dropbox App Console](DROPBOX_OAUTH_SETUP.md#4-obtener-credenciales).

---

## 7. Despliegue

### 7.1 Login en Cloudflare

```bash
npx wrangler login
```

Se abrirá el navegador para autenticarte.

### 7.2 Deploy

```bash
npx wrangler deploy
```

Tras el deploy, obtendrás una URL como:

```
https://genmypass-oauth-proxy.<tu-subdominio>.workers.dev
```

---

## 8. Integración con el frontend

### 8.1 Opción A: Worker en subdominio

Si el Worker está en `https://api.genmypass.app` o similar, el frontend debe configurar la URL base del API:

```env
VITE_OAUTH_PROXY_URL=https://api.genmypass.app
```

Y modificar `oauth.ts` para usar:

```typescript
const TOKEN_URL = `${import.meta.env.VITE_OAUTH_PROXY_URL || window.location.origin}/api/auth/token`;
```

### 8.2 Opción B: Worker junto a Cloudflare Pages (Functions)

Cloudflare Pages permite asociar Workers como *Functions* en la misma ruta. Si el frontend está en Pages:

1. En el proyecto Pages, configura *Functions* que apunten al Worker
2. Las rutas `/api/auth/*` serán manejadas por el Worker
3. El frontend usa `window.location.origin` → las peticiones van al mismo dominio

### 8.3 Modificar handleOAuthCallback

En `src/lib/google-drive/oauth.ts`, cambiar la llamada de:

```typescript
const response = await fetch(GOOGLE_TOKEN_URL, { ... });
```

Por:

```typescript
const apiBase = import.meta.env.VITE_OAUTH_PROXY_URL ?? window.location.origin;
const response = await fetch(`${apiBase}/api/auth/token`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    code,
    code_verifier: verifier,
    redirect_uri: redirectUri,
  }),
});
```

---

## 9. Desarrollo local

### 9.1 Modo dev con Wrangler

```bash
cd workers/oauth-proxy
npx wrangler dev
```

Crea un archivo `.dev.vars` en el directorio del Worker (no versionar en git):

```
# Google (ver GOOGLE_OAUTH_SETUP.md)
GOOGLE_CLIENT_ID=tu-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-tu-secret

# Dropbox (ver DROPBOX_OAUTH_SETUP.md)
DROPBOX_CLIENT_ID=tu-app-key
DROPBOX_CLIENT_SECRET=tu-app-secret
```

### 9.2 Probar con el frontend local

Con el frontend en `http://localhost:5173`, configura:

```env
VITE_OAUTH_PROXY_URL=http://localhost:8787
```

Wrangler dev escucha en 8787 por defecto. Asegúrate de que el origen `http://localhost:5173` esté permitido en CORS (el código usa `request.headers.get("Origin")`).

---

## 10. Consideraciones de seguridad

| Aspecto | Medida |
|---------|--------|
| Client secret | Solo en secrets de Cloudflare, nunca en el frontend |
| CORS | Validar origen; en producción restringir a dominios conocidos |
| Rate limiting | Considerar Cloudflare Rate Limiting en el plan |
| Logs | Evitar loguear tokens o códigos; Workers loguean por defecto en modo debug |

### Validación de origen en producción

```typescript
const ALLOWED_ORIGINS = ["https://genmypass.app", "http://localhost:5173"];
const origin = request.headers.get("Origin");
if (!origin || !ALLOWED_ORIGINS.includes(origin)) {
  return new Response("Forbidden", { status: 403 });
}
```

---

## 11. Checklist para el TFM

- [ ] Worker creado con Wrangler
- [ ] Endpoint `POST /api/auth/token` y `POST /api/auth/refresh` (Google) implementados
- [ ] Endpoint `POST /api/auth/dropbox/token` y `POST /api/auth/dropbox/refresh` (Dropbox) implementados
- [ ] Secrets configurados: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, DROPBOX_CLIENT_ID, DROPBOX_CLIENT_SECRET
- [ ] Deploy en Cloudflare Workers
- [ ] Frontend modificado para usar el proxy
- [ ] Pruebas con flujo OAuth completo (Google y/o Dropbox)
- [ ] CORS configurado correctamente
- [ ] Documentación de la arquitectura en ADR

---

## 12. Referencias

- [ADR-003: Arquitectura serverless con Cloudflare Workers](ADR.md#adr-003-arquitectura-serverless-con-cloudflare-workers)
- [ADR-012: Sin base de datos en el backend](ADR.md#adr-012-sin-base-de-datos-en-el-backend)
- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)
- [Google OAuth 2.0 - Token endpoint](https://developers.google.com/identity/protocols/oauth2/web-server#exchange-authorization-code)
- [GOOGLE_OAUTH_SETUP.md](GOOGLE_OAUTH_SETUP.md) - Configuración de credenciales en Google Cloud Console
- [DROPBOX_OAUTH_SETUP.md](DROPBOX_OAUTH_SETUP.md) - Configuración de la app en Dropbox App Console

---

*Última actualización: Febrero 2025*
