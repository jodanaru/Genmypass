# Auditoría de Seguridad OWASP — Genmypass

> **Fecha:** 19 de febrero de 2026  
> **Versión auditada:** main (producción en https://genmypass.app)  
> **Metodología:** OWASP Top 10 (2021), OWASP ASVS 4.0, OWASP Cryptographic Storage Cheat Sheet, OWASP Password Storage Cheat Sheet  
> **Tipo de aplicación:** SPA (React) + Cloudflare Worker (OAuth proxy) — gestor de contraseñas zero-knowledge  

---

## Resumen ejecutivo

Genmypass es un gestor de contraseñas zero-knowledge donde **todo el cifrado se realiza en el cliente**. El servidor (Cloudflare Worker) actúa únicamente como proxy OAuth para proteger los client secrets de Google y Dropbox. Los datos cifrados se almacenan en el almacenamiento en la nube del propio usuario (Google Drive appDataFolder o Dropbox App Folder).

La arquitectura zero-knowledge reduce drásticamente la superficie de ataque en el lado servidor, pero traslada la responsabilidad criptográfica al frontend. Esta auditoría evalúa ambos lados.

### Calificación general

| Categoría | Estado |
|-----------|--------|
| Criptografía | ✅ Sólida |
| Autenticación | ✅ Buena |
| Gestión de sesiones | ✅ Buena |
| Control de acceso | ✅ Buena |
| Validación de entrada | ✅ Buena |
| Cabeceras de seguridad | ✅ Completas |
| Gestión de dependencias | ✅ Buena |
| Protección de datos sensibles | ⚠️ Con observaciones menores |

**Resultado global: la aplicación presenta un nivel de seguridad alto, alineado con las mejores prácticas OWASP para aplicaciones de gestión de contraseñas.**

---

## 1. OWASP A01:2021 — Pérdida de control de acceso (Broken Access Control)

### 1.1 Protección de rutas en el frontend

**Estado: ✅ Cumple**

- Las rutas del vault, entradas y configuración están protegidas por `ProtectedRoute`, que verifica `isUnlocked` del `auth-store` antes de renderizar.
- Si el usuario no está autenticado, se redirige a `/lock`.
- Las rutas públicas (landing, connect, callback, lock) están correctamente separadas.

```tsx
// src/router/ProtectedRoute.tsx
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const isUnlocked = useAuthStore((s) => s.isUnlocked);
  if (!isUnlocked) {
    return <Navigate to="/lock" state={{ from: location }} replace />;
  }
  return <>{children}</>;
}
```

### 1.2 Control de acceso en el backend (OAuth Proxy)

**Estado: ✅ Cumple**

- El proxy OAuth solo acepta peticiones `POST` en las rutas de token y refresh.
- Validación CORS estricta con allowlist de orígenes configurables (`ALLOWED_ORIGINS` / defaults a producción y localhost).
- Las peticiones sin `Origin` se permiten (same-origin), pero las cross-origin deben coincidir con la allowlist.
- Responde `403 Forbidden` a orígenes no autorizados.
- Todas las demás rutas devuelven `404 Not Found`.

### 1.3 Permisos en almacenamiento cloud

**Estado: ✅ Cumple**

- Google Drive: scope mínimo `drive.appdata` (solo carpeta privada de la app) + `userinfo.email`.
- Dropbox: scopes mínimos `files.content.write`, `files.content.read`, `account_info.read` (solo App Folder).
- Principio de mínimo privilegio aplicado correctamente.

---

## 2. OWASP A02:2021 — Fallos criptográficos (Cryptographic Failures)

### 2.1 Derivación de clave (KDF)

**Estado: ✅ Cumple — Referencia OWASP**

| Parámetro | Valor | Referencia OWASP |
|-----------|-------|------------------|
| Algoritmo | Argon2id | ✅ Recomendado como primera opción |
| Memoria | 64 MiB (65.536 KiB) | ✅ ≥ 19 MiB (OWASP 2025) |
| Iteraciones | 3 | ✅ ≥ 2 (OWASP 2025) |
| Longitud de salida | 32 bytes | ✅ Estándar para AES-256 |
| Sal | 16 bytes aleatorios (CSPRNG) | ✅ ≥ 16 bytes |
| Biblioteca | libsodium-wrappers-sumo (`crypto_pwhash`) | ✅ Implementación de referencia auditada |

### 2.2 Cifrado simétrico

**Estado: ✅ Cumple**

| Parámetro | Valor | Referencia |
|-----------|-------|------------|
| Algoritmo | AES-256-GCM (AEAD) | ✅ NIST SP 800-38D |
| Longitud de clave | 256 bits | ✅ Máxima seguridad AES |
| IV/Nonce | 12 bytes aleatorios (CSPRNG) | ✅ Estándar GCM |
| Tag de autenticación | 128 bits (16 bytes) | ✅ Máximo para GCM |
| Implementación | Web Crypto API (`crypto.subtle`) | ✅ Implementación nativa del navegador |
| IV aleatorio por operación | Sí | ✅ Evita reutilización de nonce |

### 2.3 Generación de números aleatorios

**Estado: ✅ Cumple**

- Usa `crypto.getRandomValues()` (CSPRNG del navegador) para IV, sales y generación de contraseñas.
- Usa `sodium.randombytes_buf()` para sales de Argon2id.
- No se usa `Math.random()` en ningún contexto criptográfico.

### 2.4 Comparación en tiempo constante

**Estado: ✅ Cumple**

```typescript
// src/lib/crypto/utils.ts
export function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a[i]! ^ b[i]!;
  }
  return diff === 0;
}
```

La implementación evita timing attacks mediante XOR sin short-circuit.

### 2.5 Clave maestra en memoria

**Estado: ⚠️ Observación menor**

- La `masterKey` (Uint8Array de 32 bytes) se mantiene en el store de Zustand (`auth-store`) mientras la sesión está activa.
- Al bloquear (`lock()`), se establece a `null`, lo cual marca la referencia para GC.
- **Limitación inherente de JavaScript:** no es posible realizar un borrado explícito de memoria (`zeroize`) porque el GC no garantiza cuándo libera la memoria. Esto es una limitación conocida del entorno, no un fallo de diseño.
- **Mitigación presente:** auto-lock configurable (1, 5, 15 minutos o nunca) que anula la referencia en cuanto se dispara.

### 2.6 Cifrado del refresh token

**Estado: ✅ Cumple**

- El refresh token se cifra con AES-256-GCM usando la `masterKey` antes de persistirse en `localStorage`.
- Se almacena como blob base64 (IV + tag + data concatenados).
- Solo se descifra cuando se necesita refrescar el access token, usando la clave derivada de la contraseña maestra.

---

## 3. OWASP A03:2021 — Inyección (Injection)

### 3.1 Sanitización de entrada

**Estado: ✅ Cumple**

El módulo `src/lib/sanitize.ts` implementa sanitización alineada con OWASP:

| Control | Implementación |
|---------|---------------|
| Eliminación de caracteres de control | Regex `[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]` |
| Trim de espacios | `.trim()` |
| Límites de longitud | Título: 256, Username: 512, URL: 2048, Notas: 10.000, Campo genérico: 2048 |
| Sanitización de URL | Allowlist de esquemas (`http:`, `https:`, `ftp:`, `mailto:`) |
| Bloqueo de esquemas peligrosos | `javascript:`, `data:`, `vbscript:` explícitamente rechazados |

### 3.2 Uso de sanitización

**Estado: ✅ Cumple**

- `EntryFormPage.tsx`: sanitiza título, username, URL y notas antes de guardar.
- `import/index.ts`: sanitiza todos los campos importados desde CSV, Bitwarden, LastPass y 1Password.
- Los formularios HTML incluyen `maxLength` como validación adicional en el lado del cliente.

### 3.3 Inyección SQL / NoSQL

**Estado: N/A** — No hay base de datos. Los datos se almacenan cifrados como JSON en archivos de la nube del usuario.

### 3.4 Inyección en el OAuth Proxy

**Estado: ✅ Cumple**

- El proxy valida la presencia de `code`, `code_verifier` y `redirect_uri` antes de reenviar a los endpoints de token de Google/Dropbox.
- Los parámetros se envían como `application/x-www-form-urlencoded` mediante `URLSearchParams`, que realiza encoding automático.
- No se construyen consultas SQL ni se ejecutan comandos del sistema.

---

## 4. OWASP A04:2021 — Diseño inseguro (Insecure Design)

### 4.1 Arquitectura zero-knowledge

**Estado: ✅ Diseño seguro**

La arquitectura sigue el principio zero-knowledge:

1. **El servidor nunca ve datos en claro:** el proxy OAuth solo maneja tokens de autenticación, nunca datos del vault.
2. **El servidor nunca ve la contraseña maestra:** la derivación de clave se hace íntegramente en el cliente.
3. **El servidor nunca ve la clave de cifrado:** ni la derivada (masterKey) ni las claves intermedias salen del navegador.
4. **Los datos almacenados en la nube son opacos:** Google Drive / Dropbox solo contienen blobs cifrados con AES-256-GCM.

### 4.2 Protección contra fuerza bruta

**Estado: ✅ Cumple**

- **Argon2id con 64 MiB / 3 iteraciones:** cada intento de descifrado requiere ~0.5-1 segundo en hardware estándar, haciendo impracticable el brute-force offline.
- **Cooldown exponencial en la pantalla de bloqueo:** tras 3 intentos fallidos, se aplica un retardo creciente (2^n segundos, máximo 30 s).
- **Indicador de fortaleza en tiempo real** durante la configuración de la contraseña maestra.
- **Verificación HIBP** (Have I Been Pwned) con k-anonymity durante la configuración y auditoría.

### 4.3 Requisitos de contraseña maestra

**Estado: ✅ Cumple**

La configuración exige cumplir todos los requisitos simultáneamente:

- Mínimo 12 caracteres
- Mayúsculas y minúsculas
- Al menos un dígito
- Al menos un símbolo especial

### 4.4 Modelo de amenaza considerado

**Estado: ✅ Adecuado**

El diseño contempla correctamente:

- Compromiso del almacenamiento cloud → datos cifrados, inútiles sin la contraseña.
- Compromiso del proxy OAuth → solo tiene client secrets de OAuth, no datos de usuario.
- MITM → mitigado por HSTS, HTTPS obligatorio y PKCE.
- XSS → mitigado por CSP estricta, React escaping por defecto, sanitización.
- CSRF en OAuth → mitigado por parámetro `state` y PKCE.

---

## 5. OWASP A05:2021 — Configuración de seguridad incorrecta (Security Misconfiguration)

### 5.1 Cabeceras de seguridad HTTP

**Estado: ✅ Completas**

Cabeceras configuradas en `public/_headers` (Cloudflare Pages):

| Cabecera | Valor | Evaluación |
|----------|-------|-----------|
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` | ✅ 2 años, con preload |
| `X-Content-Type-Options` | `nosniff` | ✅ |
| `X-Frame-Options` | `DENY` | ✅ Previene clickjacking |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | ✅ |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` | ✅ Mínimo privilegio |
| `Content-Security-Policy` | Ver detalle abajo | ✅ Restrictiva |

### 5.2 Content Security Policy (CSP)

**Estado: ✅ Buena — con una observación**

```
default-src 'self';
script-src 'self';
style-src 'self' 'unsafe-inline';
font-src 'self';
connect-src 'self' https://oauth2.googleapis.com https://www.googleapis.com
            https://api.dropboxapi.com https://content.dropboxapi.com
            https://api.pwnedpasswords.com https://*.genmypass.app;
img-src 'self' data:;
object-src 'none';
base-uri 'self';
form-action 'self';
```

| Directiva | Evaluación |
|-----------|-----------|
| `script-src 'self'` | ✅ Excelente — sin `unsafe-inline` ni `unsafe-eval` |
| `style-src 'self' 'unsafe-inline'` | ⚠️ `unsafe-inline` necesario por Tailwind CSS en desarrollo. Aceptable dado que `script-src` es estricto y el vector de ataque principal (XSS vía scripts) está bloqueado. |
| `connect-src` | ✅ Allowlist de dominios necesarios |
| `object-src 'none'` | ✅ Bloquea plugins |
| `img-src 'self' data:` | ✅ `data:` solo para imágenes (favicons inline) |
| `form-action 'self'` | ✅ Previene exfiltración vía formularios |

**Observación:** falta la directiva `frame-ancestors 'none'` (equivalente CSP de `X-Frame-Options: DENY`). Ambas están presentes pero incluir `frame-ancestors` en la CSP proporcionaría redundancia moderna.

### 5.3 Cabeceras en el OAuth Proxy (Cloudflare Worker)

**Estado: ✅ Cumple**

El proxy añade cabeceras de seguridad en todas las respuestas:

```typescript
{
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
}
```

### 5.4 Variables de entorno

**Estado: ✅ Cumple**

- Los client secrets de OAuth se almacenan como secretos de Cloudflare Workers (variables de entorno cifradas), nunca en el código fuente.
- El `.env.example` solo contiene IDs de cliente públicos (no secrets).
- Los client IDs del frontend (`VITE_GOOGLE_CLIENT_ID`, `VITE_DROPBOX_CLIENT_ID`) son valores públicos por diseño en OAuth con PKCE.

---

## 6. OWASP A06:2021 — Componentes vulnerables y desactualizados

### 6.1 Gestión de dependencias

**Estado: ✅ Buena**

| Control | Implementación |
|---------|---------------|
| Lock file | `pnpm-lock.yaml` presente y versionado |
| Auditoría automatizada | GitHub Actions workflow `audit.yml` ejecuta `pnpm audit --audit-level moderate` |
| Frecuencia de auditoría | En cada PR + cada lunes a las 08:00 UTC (cron) |
| Dependencias mínimas | Solo 9 dependencias de producción |

### 6.2 Dependencias de producción evaluadas

| Dependencia | Versión | Riesgo | Notas |
|-------------|---------|--------|-------|
| `libsodium-wrappers-sumo` | ^0.7.15 | Bajo | Binding de libsodium auditado. Sumo incluye Argon2id. |
| `react` / `react-dom` | ^19.0.0 | Bajo | Framework maduro con escapado automático de XSS. |
| `zustand` | ^5.0.2 | Bajo | Store minimalista, sin persistencia por defecto (salvo donde se opta con `persist`). |
| `react-router-dom` | ^7.13.0 | Bajo | Enrutado estándar. |
| `i18next` / `react-i18next` | ^25.8.3 / ^16.5.4 | Bajo | Internacionalización. Sin renderizado HTML de traducciones. |
| `lucide-react` | ^0.563.0 | Bajo | Iconos SVG puros. |
| `reveal.js` | ^5.2.1 | Bajo | Solo usado para presentación de slides. |

### 6.3 Cadena de suministro

**Estado: ✅ Buena**

- Script `postinstall-libsodium.mjs` solo realiza una copia de archivos WASM para producción, sin ejecutar código externo.
- No hay scripts post-install de terceros peligrosos.

---

## 7. OWASP A07:2021 — Fallos de identificación y autenticación

### 7.1 Flujo OAuth 2.0 con PKCE

**Estado: ✅ Cumple — Mejores prácticas**

| Control | Implementación |
|---------|---------------|
| PKCE (RFC 7636) | ✅ S256 challenge con verifier de 32 bytes aleatorios |
| Parámetro `state` | ✅ 24 bytes aleatorios, verificado en callback |
| Almacenamiento de `verifier`/`state` | `sessionStorage` (expira con la pestaña) |
| Validación de `state` | Comparación estricta, limpieza tras uso |
| `access_type: offline` | ✅ Para obtener refresh token |
| `prompt: consent` | ✅ Fuerza consentimiento explícito |

### 7.2 Gestión de tokens

**Estado: ✅ Cumple**

| Control | Implementación |
|---------|---------------|
| Access token | Solo en memoria (variable del módulo), nunca en storage |
| Refresh token | Cifrado con AES-256-GCM (masterKey) antes de persistir en localStorage |
| Auto-refresh | 5 minutos antes de expiración |
| Limpieza al lock | `clearSessionTokens()` anula access token y detiene auto-refresh |
| Token temporal post-reconexión | Se cifra con masterKey al desbloquear y se elimina el texto plano |

### 7.3 Pantalla de bloqueo

**Estado: ✅ Cumple**

- Verifica la contraseña maestra contra el vault cifrado real (no contra un hash almacenado localmente).
- Implementa cooldown exponencial tras 3 intentos fallidos.
- Detecta y maneja apropiadamente: token expirado, vault no encontrado, vault eliminado.

---

## 8. OWASP A08:2021 — Fallos de integridad del software y datos

### 8.1 Integridad del vault

**Estado: ✅ Cumple**

- AES-256-GCM es un cifrado autenticado (AEAD): el tag de 128 bits garantiza que cualquier modificación del ciphertext, IV o datos será detectada en el descifrado.
- Additional Authenticated Data (AAD) está disponible en la interfaz aunque no se usa actualmente para el vault principal (los campos salt+iv+tag+data ya están cubiertos por GCM).

### 8.2 Integridad del backup exportado

**Estado: ✅ Cumple**

- El backup `.genmypass` se cifra con una sal nueva e independiente.
- El formato incluye metadatos de KDF para permitir la importación futura incluso si los parámetros por defecto cambian.
- La importación valida el formato, estructura JSON, campos de cifrado y descifrado antes de aceptar las entradas.

### 8.3 Service Worker (PWA)

**Estado: ✅ Cumple**

- `registerType: "autoUpdate"` de vite-plugin-pwa actualiza automáticamente el service worker.
- Workbox cachea solo assets estáticos (`**/*.{js,css,html,ico,png,svg,woff2}`).
- No se cachean respuestas de API ni datos del vault.

---

## 9. OWASP A09:2021 — Fallos de registro y monitorización

### 9.1 Logging del frontend

**Estado: ⚠️ Observación**

- Los errores de carga y guardado del vault se registran con `console.error()`.
- No se implementa un sistema de telemetría o logging estructurado.
- **Esto es aceptable y deseable para una aplicación zero-knowledge:** un sistema de logging externo podría filtrar información sensible del usuario.

### 9.2 Logging del OAuth Proxy

**Estado: ✅ Cumple**

- Cloudflare Workers tiene observability habilitada (`observability: { enabled: true }` en `wrangler.jsonc`).
- Los errores del proxy se devuelven como JSON estructurado con tipos de error clasificados.
- Los errores internos genéricos no exponen detalles de implementación (`"Error en el servidor"`).

### 9.3 Clasificación de errores de API

**Estado: ✅ Buena práctica**

El módulo `api-errors.ts` implementa una clasificación completa (ADR-016):

| Tipo | Reintentable | Ejemplo |
|------|-------------|---------|
| `network` | Sí | Fallo de red |
| `service_unavailable` | Sí | HTTP 5xx |
| `too_many_requests` | Sí | HTTP 429 |
| `session_expired` | No | HTTP 401 |
| `forbidden` | No | HTTP 403 |
| `not_found` | No | HTTP 404 |
| `bad_request` | No | HTTP 4xx |

---

## 10. OWASP A10:2021 — Server-Side Request Forgery (SSRF)

### 10.1 OAuth Proxy

**Estado: ✅ Cumple**

- El proxy solo envía peticiones a URLs fijas y codificadas en el código:
  - `https://oauth2.googleapis.com/token`
  - `https://api.dropboxapi.com/oauth2/token`
- No acepta URLs proporcionadas por el usuario para realizar peticiones del lado del servidor.
- Los parámetros del usuario (`code`, `code_verifier`, `redirect_uri`) se pasan como datos del formulario al endpoint de token, nunca como URLs de destino.

---

## Análisis adicional: OWASP Cryptographic Storage Cheat Sheet

### Gestión de claves

| Requisito OWASP | Estado | Implementación |
|-----------------|--------|---------------|
| Usar algoritmos estándar y probados | ✅ | AES-256-GCM (Web Crypto), Argon2id (libsodium) |
| No implementar criptografía propia | ✅ | APIs estándar del navegador y libsodium |
| Generar IVs aleatorios por operación | ✅ | `crypto.getRandomValues()` para cada encrypt |
| Usar claves de longitud adecuada | ✅ | 256 bits para AES |
| Sales únicas por usuario | ✅ | Sal aleatoria de 16 bytes por vault |
| Proteger claves en reposo | ✅ | Refresh token cifrado; masterKey solo en memoria |
| Rotar claves cuando sea necesario | ✅ | Funcionalidad de cambio de contraseña (re-cifra vault) |

### Generación de contraseñas

| Requisito | Estado | Implementación |
|-----------|--------|---------------|
| CSPRNG | ✅ | `crypto.getRandomValues()` |
| Longitud configurable | ✅ | 8–64 caracteres |
| Conjuntos de caracteres configurables | ✅ | Mayúsculas, minúsculas, números, símbolos |
| Sin sesgo de módulo significativo | ✅ | Usa 16 bits de entropía por carácter (2 bytes), sesgo despreciable |
| Shuffle criptográfico | ✅ | Fisher-Yates con CSPRNG |

---

## Análisis adicional: Protección de datos sensibles

### Datos en reposo

| Dato | Almacenamiento | Protección |
|------|---------------|-----------|
| Vault (entradas, carpetas, settings) | Google Drive / Dropbox | AES-256-GCM con clave derivada de Argon2id |
| Refresh token | `localStorage` (clave `ert`) | AES-256-GCM con masterKey |
| Sal de derivación | `localStorage` | En claro (necesaria para derivar la clave; sin valor sin la contraseña) |
| Access token | Variable en memoria | Nunca persistido; se pierde al cerrar pestaña |
| Contraseña maestra | Nunca almacenada | Solo existe en memoria durante la derivación |
| MasterKey | Store Zustand (memoria) | Se anula al lock; nunca persistida |

### Datos en tránsito

| Canal | Protección |
|-------|-----------|
| Frontend → Google/Dropbox APIs | HTTPS obligatorio (CSP `connect-src`) |
| Frontend → OAuth Proxy | HTTPS (HSTS preload) |
| OAuth Proxy → Google/Dropbox token endpoints | HTTPS |
| Verificación HIBP | HTTPS + k-anonymity (solo 5 chars del hash SHA-1) |

### Limpieza de datos

| Evento | Acciones |
|--------|---------|
| Lock | `masterKey = null`, access token anulado, auto-refresh detenido |
| Eliminar vault | Todas las claves de localStorage y sessionStorage limpiadas (`clearAllGenmypassStorage`), vault eliminado de la nube |
| Clipboard | Limpieza automática configurable (por defecto 30 s) |

---

## Análisis adicional: Seguridad offline (PWA)

| Aspecto | Estado | Detalle |
|---------|--------|--------|
| Cola offline | ✅ | Guardado pendiente en `localStorage` (ya cifrado con AES-256-GCM) |
| Sincronización al reconectar | ✅ | `FlushOfflineQueue` reintenta al detectar conectividad |
| Datos cacheados por SW | ✅ | Solo assets estáticos, nunca datos del vault |
| Detección offline | ✅ | `useOnlineStatus` hook + componente `OfflineGuard` |

---

## Hallazgos y recomendaciones

### Hallazgos positivos (cumplimiento destacado)

1. **Criptografía de referencia:** Argon2id + AES-256-GCM con parámetros que cumplen o superan las recomendaciones OWASP 2025.
2. **PKCE implementado correctamente** en ambos proveedores OAuth (Google y Dropbox) con `state` anti-CSRF.
3. **CSP estricta** sin `unsafe-eval` y con `script-src 'self'` — excelente para una SPA.
4. **HSTS con preload** y cabeceras de seguridad completas en frontend y backend.
5. **Sanitización centralizada** con limits de longitud, eliminación de caracteres de control y validación de esquemas URL.
6. **Superficie de ataque mínima en el servidor:** el proxy solo maneja 4 endpoints de token OAuth.
7. **Auditoría automática de dependencias** semanal y por PR.
8. **Integración HIBP con k-anonymity** que no expone contraseñas.
9. **Refresh token cifrado** antes de persistirse.
10. **Generador de contraseñas con CSPRNG** y opciones de configuración completas.

### Recomendaciones (mejoras opcionales)

| # | Severidad | Recomendación | Detalle |
|---|-----------|--------------|---------|
| R1 | Baja | Añadir `frame-ancestors 'none'` a la CSP | Redundancia moderna con `X-Frame-Options: DENY`. Algunos navegadores modernos ignoran `X-Frame-Options` en favor de CSP. |
| R2 | Informativa | Considerar CSP con nonces para estilos | Eliminar `unsafe-inline` de `style-src` usando nonces o hashes CSP para estilos inline de Tailwind. Requiere integración con el build (complejidad vs. beneficio marginal dado que `script-src` ya es estricto). |
| R3 | Informativa | Limitar intentos de desbloqueo con borrado progresivo | Considerar wipe del vault local tras N intentos fallidos consecutivos (ej. 20). El vault en la nube no se afectaría, pero protegería contra ataques de fuerza bruta en un dispositivo robado. |
| R4 | Informativa | Añadir cabecera `Cross-Origin-Opener-Policy` | `COOP: same-origin` aisla el browsing context, protegiendo contra ataques de tipo Spectre en ciertos escenarios. |
| R5 | Informativa | Añadir cabecera `Cross-Origin-Embedder-Policy` | `COEP: require-corp` junto con COOP habilita `crossOriginIsolated`, dando acceso a `SharedArrayBuffer` y mejoras de aislamiento de memoria. Esto podría beneficiar a libsodium-sumo si se compila con threads WASM en el futuro. |
| R6 | Informativa | Añadir rate limiting al OAuth Proxy | Aunque el proxy es stateless y ligero, un rate limit por IP (vía Cloudflare) reduciría el riesgo de abuso. |
| R7 | Informativa | Implementar Subresource Integrity (SRI) | Para los chunks JS del build, SRI verificaría que los archivos no han sido modificados en tránsito o en CDN. Con Cloudflare Pages sirviendo desde el mismo origen, el riesgo es mínimo. |

---

## Resumen de cumplimiento OWASP Top 10

| # | Categoría OWASP | Estado | Notas |
|---|----------------|--------|-------|
| A01 | Broken Access Control | ✅ Cumple | Rutas protegidas, CORS estricto, scopes mínimos |
| A02 | Cryptographic Failures | ✅ Cumple | Argon2id + AES-256-GCM, parámetros OWASP 2025 |
| A03 | Injection | ✅ Cumple | Sanitización centralizada, no hay DB |
| A04 | Insecure Design | ✅ Cumple | Arquitectura zero-knowledge bien diseñada |
| A05 | Security Misconfiguration | ✅ Cumple | Cabeceras completas, CSP estricta, secrets protegidos |
| A06 | Vulnerable Components | ✅ Cumple | Dependencias mínimas, auditoría automatizada |
| A07 | Auth Failures | ✅ Cumple | PKCE, state, cooldown, requisitos de contraseña |
| A08 | Software/Data Integrity | ✅ Cumple | AEAD, backups verificados, PWA auto-update |
| A09 | Logging Failures | ⚠️ Aceptable | Logging mínimo (intencional en zero-knowledge) |
| A10 | SSRF | ✅ Cumple | URLs de destino fijas en el proxy |

---

## Conclusión

Genmypass presenta una postura de seguridad **sólida y bien fundamentada** para un gestor de contraseñas zero-knowledge. La elección de algoritmos criptográficos (Argon2id + AES-256-GCM), la implementación correcta de OAuth 2.0 con PKCE, las cabeceras de seguridad HTTP completas y la sanitización de entrada demuestran un diseño consciente de la seguridad desde la fase de arquitectura.

Las recomendaciones identificadas son de severidad baja o informativa, y representan hardening adicional más que correcciones de vulnerabilidades. No se han identificado vulnerabilidades de severidad alta o crítica.
