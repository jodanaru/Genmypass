# Architecture Decision Records (ADR)
## Gestor de Contraseñas Zero-Knowledge Multiplataforma

**Proyecto:** Password Manager con almacenamiento en cloud del usuario  
**Autor:** David Navarro  
**Fecha inicio:** 29 enero 2025  
**Última actualización:** 14 febrero 2025

---

## Índice de Decisiones

1. [ADR-001: Modelo Zero-Knowledge con almacenamiento en cloud del usuario](#adr-001-modelo-zero-knowledge-con-almacenamiento-en-cloud-del-usuario)
2. [ADR-002: Stack tecnológico - React + Vite para frontend](#adr-002-stack-tecnológico---react--vite-para-frontend)
3. [ADR-003: Arquitectura serverless con Cloudflare Workers](#adr-003-arquitectura-serverless-con-cloudflare-workers)
4. [ADR-004: Google Drive como proveedor primario, Dropbox secundario](#adr-004-google-drive-como-proveedor-primario-dropbox-secundario)
5. [ADR-005: Modelo de autenticación - Login directo con OAuth, sin usuarios propios](#adr-005-modelo-de-autenticación---login-directo-con-oauth-sin-usuarios-propios)
6. [ADR-006: Criptografía - Argon2id + AES-256-GCM](#adr-006-criptografía---argon2id--aes-256-gcm)
7. [ADR-007: Modelo híbrido de seguridad - Password-only o Dual-key opcional](#adr-007-modelo-híbrido-de-seguridad---password-only-o-dual-key-opcional)
8. [ADR-008: Vault unificado vs múltiples archivos](#adr-008-vault-unificado-vs-múltiples-archivos)
9. [ADR-009: Folders como organización vs Vaults múltiples](#adr-009-folders-como-organización-vs-vaults-múltiples)
10. [ADR-010: Sincronización multi-dispositivo con Last-Write-Wins](#adr-010-sincronización-multi-dispositivo-con-last-write-wins)
11. [ADR-011: PWA como solución multiplataforma](#adr-011-pwa-como-solución-multiplataforma)
12. [ADR-012: Sin base de datos en el backend](#adr-012-sin-base-de-datos-en-el-backend)
13. [ADR-013: Verificación de contraseñas comprometidas con Have I Been Pwned](#adr-013-verificación-de-contraseñas-comprometidas-con-have-i-been-pwned)
14. [ADR-014: Soporte multiidioma con i18n](#adr-014-soporte-multiidioma-con-i18n)
15. [ADR-015: Estrategia de testing](#adr-015-estrategia-de-testing)
16. [ADR-016: Manejo de errores y retry logic para APIs](#adr-016-manejo-de-errores-y-retry-logic-para-apis)

---

## ADR-001: Modelo Zero-Knowledge con almacenamiento en cloud del usuario

**Estado:** ✅ Aceptado  
**Fecha:** 29 enero 2025  
**Decisores:** David Navarro

### Contexto

Los gestores de contraseñas tradicionales (LastPass, Dashlane) almacenan datos cifrados en servidores controlados por la empresa. Esto presenta riesgos:
- El servidor es un único punto de fallo de seguridad
- Breach del servidor expone todos los vaults (LastPass 2022-2023)
- Los usuarios deben confiar en la infraestructura de la empresa
- Costos de hosting y mantenimiento para el desarrollador

**Alternativas consideradas:**
1. Almacenamiento centralizado tradicional (servidor propio)
2. Modelo zero-knowledge con almacenamiento en servidor propio
3. **Modelo zero-knowledge con almacenamiento en cloud del usuario** ✅

### Decisión

Se implementará un modelo **zero-knowledge verdadero** donde:
- El vault cifrado se almacena en el espacio cloud personal del usuario (Google Drive, Dropbox)
- El backend del desarrollador NUNCA ve ni almacena datos sensibles
- Toda la criptografía ocurre client-side en el navegador
- El servidor solo actúa como facilitador de OAuth

### Consecuencias

**Positivas:**
- ✅ Máxima seguridad: no hay servidor central que comprometer
- ✅ Control total del usuario sobre sus datos
- ✅ Costo $0 en almacenamiento para el desarrollador
- ✅ Privacidad por diseño (GDPR-compliant inherentemente)
- ✅ Diferenciador técnico para el TFM

**Negativas:**
- ⚠️ Dependencia de APIs de terceros (Google Drive, Dropbox)
- ⚠️ Complejidad en sincronización entre dispositivos
- ⚠️ Usuario debe tener cuenta de Google/Dropbox
- ⚠️ Límites de cuota de APIs a considerar

**Riesgos mitigados:**
- Backup: usuario puede descargar vault.enc manualmente
- Vendor lock-in: soporte para múltiples proveedores cloud

---

## ADR-002: Stack tecnológico - React + Vite para frontend

**Estado:** ✅ Aceptado  
**Fecha:** 29 enero 2025

### Contexto

Necesidad de una aplicación multiplataforma (web, móvil, escritorio) con desarrollo rápido y moderno.

**Alternativas consideradas:**
1. React Native (apps nativas móviles)
2. Flutter (apps nativas cross-platform)
3. Electron (app de escritorio)
4. **React + Vite + PWA** ✅

### Decisión

Stack frontend:
- **React 19** - Librería UI moderna y ampliamente adoptada
- **Vite 6** - Build tool ultra-rápido (20x más rápido que Webpack)
- **TypeScript** - Type safety y mejor DX
- **Zustand** - State management ligero sin boilerplate
- **Shadcn/ui + Radix** - Componentes accesibles y profesionales
- **Tailwind CSS** - Utility-first styling
- **PWA** - Capacidades nativas (offline, instalable)

### Consecuencias

**Positivas:**
- ✅ Un solo codebase para web, móvil y escritorio
- ✅ Hot Module Replacement instantáneo con Vite
- ✅ Ecosystem maduro de React (librerías, community)
- ✅ PWA permite instalación sin app stores
- ✅ Desarrollo muy rápido con Cursor AI

**Negativas:**
- ⚠️ Performance ligeramente inferior a apps nativas (aceptable para gestor de passwords)
- ⚠️ Limitaciones de PWA en iOS (manageable)

---

## ADR-003: Arquitectura serverless con Cloudflare Workers

**Estado:** ✅ Aceptado  
**Fecha:** 29 enero 2025

### Contexto

El backend solo necesita facilitar OAuth (intercambio de códigos por tokens). No hay lógica de negocio ni base de datos.

**Alternativas consideradas:**
1. Sin backend (OAuth 100% client-side) - Expone client_secret
2. Backend tradicional (Express/Fastify en VPS) - Costo ~$5-7/mes
3. **Serverless con Cloudflare Workers** ✅

### Decisión

Arquitectura serverless:
- **Cloudflare Pages** - Hosting frontend estático (CDN global)
- **Cloudflare Workers** - 2 funciones para OAuth proxy
  - `POST /api/auth/token` - Intercambiar code por tokens
  - `POST /api/auth/refresh` - Renovar access tokens
- Sin servidor tradicional, sin base de datos

### Consecuencias

**Positivas:**
- ✅ **Costo $0/mes** (100,000 req/día gratis en Workers)
- ✅ Deploy automático con git push
- ✅ Escalado automático e infinito
- ✅ Latencia ultra-baja (edge computing global)
- ✅ Client secret protegido
- ✅ No hay servidor que mantener

**Negativas:**
- ⚠️ Limitación de 10ms CPU time por request (suficiente para proxy OAuth)
- ⚠️ Curva de aprendizaje de Workers (pequeña)

---

## ADR-004: Google Drive como proveedor primario, Dropbox secundario

**Estado:** ✅ Aceptado  
**Fecha:** 29 enero 2025

### Contexto

Necesidad de almacenar vault cifrado en cloud del usuario.

**Comparativa de proveedores:**

| Factor | Google Drive | Dropbox | OneDrive | iCloud |
|--------|--------------|---------|----------|--------|
| Almacenamiento gratuito | 15 GB | 2 GB | 5 GB | 5 GB |
| Carpeta oculta app | ✅ appDataFolder | ❌ Visible | ⚠️ Limitada | ❌ No |
| Adopción usuarios | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ (solo Apple) |
| API documentación | Excelente | Excelente | Media | Limitada |
| Long polling | ❌ | ✅ | ❌ | N/A |

### Decisión

Implementar soporte para:
1. **Google Drive API v3** (prioridad 1) - `appDataFolder` oculto
2. **Dropbox API v2** (prioridad 2) - App Folder

Usuario elige proveedor durante setup inicial.

### Consecuencias

**Positivas:**
- ✅ Mayor adopción con Google Drive (95%+ usuarios tienen cuenta)
- ✅ appDataFolder oculta vault de usuario casual
- ✅ Dropbox como fallback para usuarios sin Google
- ✅ Demuestra integración con múltiples APIs

**Negativas:**
- ⚠️ Duplicación de código de integración (mitigable con abstracción)
- ⚠️ Testing en ambas plataformas

**Trabajo futuro:**
- OneDrive, iCloud como proveedores adicionales

---

## ADR-005: Modelo de autenticación - Login directo con OAuth, sin usuarios propios

**Estado:** ✅ Aceptado  
**Fecha:** 29 enero 2025

### Contexto

Modelos de autenticación posibles:

**Alternativa 1:** Sistema tradicional de usuarios
- Registro con email/password propio
- Backend con base de datos de usuarios
- Vincular Google Drive después
- NO es zero-knowledge (backend conoce identidad)

**Alternativa 2:** Login directo con OAuth ✅
- Sin registro previo en la app
- Usuario autoriza acceso a Google/Dropbox directamente
- Backend nunca conoce identidad del usuario
- Zero-knowledge puro

### Decisión

**Login directo con OAuth 2.0 PKCE:**
1. Usuario hace click "Conectar con Google Drive"
2. OAuth flow → Tokens en frontend
3. Si no existe vault → Crear Master Password
4. Si existe vault → Pedir Master Password para desbloquear

**No hay concepto de "usuarios" en el backend.**

### Consecuencias

**Positivas:**
- ✅ Zero-knowledge verdadero mantenido
- ✅ Sin base de datos de usuarios
- ✅ Experiencia de usuario más simple (un paso menos)
- ✅ Google/Dropbox manejan seguridad de cuentas
- ✅ Menos código, menos complejidad

**Negativas:**
- ⚠️ Usuario debe tener cuenta Google/Dropbox (99% la tienen)
- ⚠️ Si Google bloquea la cuenta, se pierde acceso (pero datos siguen cifrados en Drive)

---

## ADR-006: Criptografía - Argon2id + AES-256-GCM

**Estado:** ✅ Aceptado  
**Fecha:** 29 enero 2025

### Contexto

Necesidad de cifrar vault de manera segura contra ataques offline.

**Requisitos de seguridad:**
- Resistente a GPU cracking (derivación de clave costosa)
- Cifrado autenticado (integridad + confidencialidad)
- Parámetros ajustables según hardware
- Estándares de la industria

**Comparativa de KDFs:**

| KDF | Resistencia GPU | Memoria | Estándar |
|-----|-----------------|---------|----------|
| PBKDF2-SHA256 | ❌ Baja | No usa | NIST |
| bcrypt | ⚠️ Media | 4 KB fijo | Legacy |
| scrypt | ✅ Alta | Configurable | Bueno |
| **Argon2id** | ✅ Máxima | Configurable | OWASP 2025 |

### Decisión

**Key Derivation Function:** Argon2id
```javascript
// Parámetros OWASP 2025 recomendados
{
  memory: 64 * 1024,    // 64 MB (ajustable según dispositivo)
  iterations: 3,
  parallelism: 4,
  hashLength: 32        // 256 bits para AES-256
}
```

**Cifrado:** AES-256-GCM
- Modo autenticado (evita tampering)
- Nonce único por operación (12 bytes random)
- Tag de autenticación (16 bytes)

**Librerías:**
- `libsodium.js` para Argon2id (referencia, audited)
- `WebCrypto API` para AES-GCM (nativo, hardware-accelerated)

### Consecuencias

**Positivas:**
- ✅ Estado del arte en 2025 (recomendación OWASP)
- ✅ Resistente a ASICs y GPUs
- ✅ Parámetros ajustables por dispositivo
- ✅ AES-GCM con aceleración hardware (rápido)
- ✅ Librerías maduras y auditadas

**Negativas:**
- ⚠️ Argon2id requiere libsodium.js (~150KB)
- ⚠️ 3 segundos de derivación puede parecer lento (pero es feature, no bug)

**Nota:** PBKDF2 como fallback si WebAssembly no disponible (muy raro hoy)

---

## ADR-007: Modelo híbrido de seguridad - Password-only o Dual-key opcional

**Estado:** ✅ Aceptado  
**Fecha:** 29 enero 2025

### Contexto

Balance entre seguridad máxima y usabilidad.

**Modelo 1Password:** Secret Key + Master Password
- PRO: Protege contra brute force incluso si vault robado
- CON: Usuario debe guardar Secret Key (UX complejo)

**Modelo Bitwarden:** Solo Master Password
- PRO: Simple de usar
- CON: Vulnerable si password débil y vault robado

### Decisión

**Modelo híbrido con elección del usuario:**

1. **Modo básico (default):** Solo Master Password
   - Clave = Argon2id(password, salt)
   - Para usuarios que prefieren simplicidad
   - Suficiente si password fuerte

2. **Modo avanzado (opt-in):** Dual-key (Master Password + Secret Key)
   - Clave = Argon2id(password, salt) XOR SecretKey
   - Secret Key: 128 bits random, formato `XXXX-XXXX-XXXX-XXXX-XXXX`
   - Para usuarios que quieren máxima seguridad

**UI clara durante setup:**
```
¿Cómo quieres proteger tu vault?

○ Solo contraseña maestra (recomendado)
  Más simple. Asegúrate de usar una contraseña fuerte.

○ Contraseña + Clave secreta (máxima seguridad)
  Necesitarás guardar una clave adicional de 20 caracteres.
```

### Consecuencias

**Positivas:**
- ✅ Usuario elige según su modelo de amenazas
- ✅ Default simple para mayoría de usuarios
- ✅ Opción avanzada para paranoides
- ✅ Demuestra comprensión de trade-offs de seguridad

**Negativas:**
- ⚠️ Dos flujos de código a mantener (pequeño overhead)
- ⚠️ Documentación debe explicar diferencias claramente

---

## ADR-008: Vault unificado vs múltiples archivos

**Estado:** ✅ Aceptado  
**Fecha:** 29 enero 2025

### Contexto

**Opción A:** Un archivo por entrada
- `passwords/amazon.enc`, `passwords/google.enc`
- Granularidad máxima

**Opción B:** Un archivo único para todo el vault
- `vault.enc` contiene todas las entradas
- Atomicidad en operaciones

### Decisión

**Vault unificado** en un solo archivo `vault.enc`:

```typescript
interface EncryptedVault {
  version: 1;
  security_mode: 'password-only' | 'dual-key';
  kdf_params: {
    algorithm: 'argon2id';
    memory: number;
    iterations: number;
    parallelism: number;
    salt: string;  // Base64
  };
  encrypted_data: string;  // Base64(AES-GCM(JSON(entries)))
  nonce: string;           // Base64
  auth_tag: string;        // Base64
  created_at: string;
  updated_at: string;
}
```

### Consecuencias

**Positivas:**
- ✅ Una sola operación de descifrado (rápido)
- ✅ Sincronización atómica (todo o nada)
- ✅ Estructura simple
- ✅ Metadata no filtra número de passwords

**Negativas:**
- ⚠️ Re-cifrar todo al editar una entrada (aceptable, vault pequeño)
- ⚠️ Si corrupción, se pierde todo (backup mitiga)

**Tamaño esperado:**
- 100 passwords ≈ 50-100 KB cifrado
- 1000 passwords ≈ 500 KB - 1 MB
- Bien dentro de límites de APIs

---

## ADR-009: Folders como organización vs Vaults múltiples

**Estado:** ✅ Aceptado  
**Fecha:** 29 enero 2025

### Contexto

Usuario quiere organizar contraseñas por categoría.

**Opción A:** Vaults separados
- `work-vault.enc`, `personal-vault.enc`
- Cada uno con su Master Password
- Aislamiento total

**Opción B:** Folders dentro de un vault
- Un vault, múltiples folders (tags)
- Un solo Master Password
- Más simple

### Decisión

**Folders (tags) dentro de vault único:**

```typescript
interface VaultEntry {
  id: string;
  title: string;
  username: string;
  password: string;
  url?: string;
  notes?: string;
  folder?: string;      // ← Organización
  tags?: string[];      // ← Tags adicionales
  favorite: boolean;
  created_at: string;
  updated_at: string;
}
```

**Folders predefinidos + custom:**
- 📁 Todas
- ⭐ Favoritas
- 💼 Trabajo
- 🏠 Personal
- 🛒 Compras
- 💰 Finanzas
- ➕ Crear folder...

### Consecuencias

**Positivas:**
- ✅ Un solo Master Password (mejor UX)
- ✅ Búsqueda global fácil
- ✅ Implementación simple
- ✅ Suficiente para mayoría de usuarios

**Negativas:**
- ⚠️ No hay aislamiento entre folders (si alguien tiene tu password, ve todo)
- ⚠️ No puedes compartir un folder sin compartir todo

**Trabajo futuro (post-MVP):**
- Vaults separados si hay demanda

---

## ADR-010: Sincronización multi-dispositivo con Last-Write-Wins

**Estado:** ✅ Aceptado  
**Fecha:** 29 enero 2025

### Contexto

Usuario edita desde múltiples dispositivos. Posibles conflictos si editan offline.

**Estrategias de resolución:**

| Estrategia | Complejidad | Pérdida de datos |
|------------|-------------|------------------|
| Last-Write-Wins (LWW) | Baja | Posible |
| First-Write-Wins | Baja | Posible |
| Manual merge | Media | No |
| CRDT automático | Alta | No |

### Decisión

**Last-Write-Wins (LWW)** a nivel de entrada individual:

1. Cada entrada tiene `updated_at` timestamp
2. Al sincronizar:
   - Si `id` existe en ambos → Gana el más reciente `updated_at`
   - Si `id` solo en local → Añadir (nueva entrada)
   - Si `id` solo en remoto → Añadir (entrada de otro dispositivo)
3. Entradas borradas usan soft-delete (`deleted_at` timestamp)
4. Subir vault fusionado con nuevo ETag

**ETags para detección de cambios:**
```javascript
const response = await fetch(`/vault.enc`, {
  headers: { 'If-None-Match': lastKnownETag }
});
if (response.status === 304) {
  // No cambios
} else {
  // Hay cambios, fusionar
}
```

### Consecuencias

**Positivas:**
- ✅ Simple de implementar y entender
- ✅ Funciona bien para vault de contraseñas
- ✅ Soft deletes permiten recuperar entradas borradas
- ✅ Determinista

**Negativas:**
- ⚠️ Puede perder edits si modifican misma entrada simultáneamente (raro)
- ⚠️ No es true merge

**Mitigación:**
- Notificación si se detecta conflicto
- Backup automático antes de merge

---

## ADR-011: PWA como solución multiplataforma

**Estado:** ✅ Aceptado  
**Fecha:** 29 enero 2025

### Contexto

**Requisito:** Aplicación multiplataforma (web, iOS, Android, escritorio)

**Alternativas:**
1. Apps nativas separadas - 3 codebases
2. React Native - No incluye web
3. Flutter - Learning curve alto
4. Electron - Solo escritorio
5. **PWA** ✅

### Decisión

Implementar como **PWA** con:
- **Web App Manifest** - Define iconos, nombre, display mode
- **Service Worker** - Cache para offline, background sync
- **Workbox** - Estrategias de cache simplificadas

**Estrategia de cache:**
- NetworkFirst para vault
- CacheFirst para assets estáticos
- Background Sync para subidas offline

### Consecuencias

**Positivas:**
- ✅ Un solo codebase para todas las plataformas
- ✅ Instalable sin app stores
- ✅ Funciona offline
- ✅ Actualizaciones instantáneas
- ✅ ~2-3 MB vs 20+ MB de apps nativas

**Negativas:**
- ⚠️ Limitaciones en iOS (notificaciones restringidas)
- ⚠️ Performance ligeramente menor que nativo

### Implementación (febrero 2025)

- **Manifest:** `start_url: "/"`, `scope: "/"`, iconos 48, 192 y 512 (maskable) para instalabilidad.
- **Cache:** Workbox `generateSW` con precache de assets (JS, CSS, HTML, fuentes) y `runtimeCaching` CacheFirst para `fonts.googleapis.com` y `fonts.gstatic.com`, de modo que la shell y las fuentes funcionen offline.
- **Detección offline:** Hook `useOnlineStatus()` y componente `OfflineGuard`: en rutas que requieren red (vault, settings, etc.) se redirige a `/offline` cuando `navigator.onLine === false`; banner informativo cuando está desconectado.
- **Subidas offline:** En lugar de Background Sync del Service Worker (las peticiones a Drive/Dropbox llevan tokens que pueden expirar antes del replay), se implementó una cola en la app: si `saveVault` falla por error de red, el payload cifrado y el fileId se guardan en un store persistente (Zustand + localStorage); al volver online o al pulsar "Reintentar ahora", se llama a `saveVault` de nuevo (el token se refresca en el flujo existente). Indicador UI "Cambios pendientes de sincronización" y botón "Reintentar ahora" en el layout del vault.

---

## ADR-012: Sin base de datos en el backend

**Estado:** ✅ Aceptado  
**Fecha:** 29 enero 2025

### Contexto

**Pregunta crítica:** Si no hay usuarios en base de datos, ¿qué función tiene el backend?

**Análisis:**
- Frontend estático → Cloudflare Pages
- Vault cifrado → Google Drive del usuario
- Claves de cifrado → Solo en cliente
- Tokens OAuth → En memoria del cliente

### Decisión

**Backend MÍNIMO sin base de datos:**

Cloudflare Workers con solo 2 funciones:
- `/api/auth/token` - Intercambiar code por tokens
- `/api/auth/refresh` - Renovar access tokens

**Backend NO hace:**
- ❌ No tiene base de datos
- ❌ No almacena tokens de usuario
- ❌ No conoce identidades
- ❌ No puede acceder a vaults

**Backend SÍ hace:**
- ✅ Proxy OAuth (protege client_secret)

### Consecuencias

**Positivas:**
- ✅ Zero-knowledge verdadero mantenido
- ✅ No hay datos que robar en el servidor
- ✅ Costo $0
- ✅ GDPR-compliant por diseño

**Negativas:**
- ⚠️ No hay panel de administración
- ⚠️ No hay analytics de uso

---

## ADR-013: Verificación de contraseñas comprometidas con Have I Been Pwned

**Estado:** ✅ Aceptado  
**Fecha:** 30 enero 2025

### Contexto

Los usuarios frecuentemente reutilizan contraseñas expuestas en brechas de datos. Necesitamos detectar contraseñas comprometidas **sin violar el modelo zero-knowledge**.

**Alternativas consideradas:**
1. No implementar verificación - Simple pero menor valor
2. Base de datos local de hashes - Requiere +15GB de datos
3. API propia con BD de HIBP - Costes de hosting
4. **API Have I Been Pwned con k-anonymity** ✅

### Decisión

Usar la **API Pwned Passwords** de HIBP con modelo **k-anonymity**:

```
1. hash = SHA1(password)           → "8843D7F92416211DE..."
2. prefix = hash[0:5]              → "8843D"
3. GET api.pwnedpasswords.com/range/8843D
4. API retorna ~500 hashes coincidentes
5. Verificación LOCAL: ¿está mi hash en la lista?
```

**La contraseña nunca abandona el dispositivo.** El servidor solo ve un prefijo de 5 caracteres que representa ~1 millón de posibles contraseñas.

**Puntos de integración:**
- Al generar nueva contraseña → Verificar automáticamente
- Al añadir entrada manual → Warning si comprometida
- Auditoría del vault → Botón "Verificar seguridad"

### Consecuencias

**Positivas:**
- ✅ Privacidad preservada (zero-knowledge compatible)
- ✅ API gratuita y sin límites de rate
- ✅ Base de datos de ~850M contraseñas actualizada constantemente
- ✅ Estándar de la industria (usado por 1Password, Firefox)

**Negativas:**
- ⚠️ Dependencia de servicio externo (mitigación: degradación elegante)
- ⚠️ Requiere conexión a internet para verificar

---

## ADR-014: Soporte multiidioma con i18n

**Estado:** ✅ Aceptado  
**Fecha:** 5 febrero 2025  

### Contexto

La aplicación Genmypass puede usarse por usuarios en distintos idiomas. Para mejorar la accesibilidad y el alcance del producto (TFM, posibles usuarios internacionales), se valora ofrecer la interfaz en más de un idioma sin duplicar código ni mantener versiones separadas por idioma.

**Alternativas consideradas:**
1. **Sin multiidioma:** App en un solo idioma (p. ej. español o inglés); documentación/legal en varios idiomas si acaso.
2. **Dos idiomas sin librería:** Detección de `navigator.language` y dos módulos de strings (p. ej. `strings.es.ts`, `strings.en.ts`) con lógica manual. Sin dependencias.
3. **Soporte multiidioma con i18n (librería de internacionalización)** ✅

### Decisión

Se utilizará **i18n** (internacionalización) en el frontend con una librería estándar del ecosistema React:

- **Enfoque:** Un solo codebase; textos extraídos a claves y archivos de traducción por idioma (p. ej. JSON o módulos por locale).
- **Stack recomendado:** react-i18next (i18next) o react-intl (FormatJS), integrado con React + Vite. La elección concreta (react-i18next vs react-intl) se hará en implementación según necesidades de formato de fechas/números y preferencia de API.
- **Idiomas iniciales:** Al menos español e inglés; el idioma por defecto y la persistencia de la preferencia (localStorage/URL) se definirán al implementar.
- **Alcance:** Toda la UI de la aplicación (landing, onboarding, vault, ajustes, mensajes de error). Los datos del usuario (contraseñas, títulos de entradas, notas) no se traducen; solo las cadenas fijas de la interfaz.

### Consecuencias

**Positivas:**
- ✅ Interfaz accesible para usuarios en varios idiomas sin duplicar código.
- ✅ Escalable: añadir nuevos idiomas es añadir archivos de traducción.
- ✅ Buen soporte para plurales, fechas y números si se usa una librería madura.
- ✅ Coherencia con buenas prácticas en aplicaciones web modernas.

**Negativas:**
- ⚠️ Hay que extraer todos los strings de la UI a claves y mantener traducciones.
- ⚠️ Aumento moderado del tamaño del bundle (librería + recursos de idiomas cargados).
- ⚠️ Decisión de persistencia del idioma (localStorage, preferencia en cuenta, etc.) y posible sincronización entre dispositivos en fases posteriores.

**Riesgos mitigados:**
- Idiomas opcionales: se pueden cargar solo los que se usen (lazy load de namespaces o idiomas) para limitar el impacto en carga inicial.

---

## ADR-015: Estrategia de testing

**Estado:** Aceptado  
**Fecha:** 14 febrero 2025

### Contexto

En un proyecto zero-knowledge, la lógica crítica (criptografía, import/export, sincronización con la nube) debe estar cubierta por tests para evitar regresiones y garantizar que los datos del usuario no se corrompen ni se exponen. Al mismo tiempo, no puede usarse información real (contraseñas, tokens, APIs de OAuth o cloud) en los tests.

**Alternativas consideradas:**
1. Solo tests unitarios en módulos aislados (crypto, stores).
2. Unitarios + tests de integración (flujos que cruzan varios módulos con mocks).
3. Añadir tests de componentes (React Testing Library) y E2E (Playwright) en fases posteriores.

### Decisión

Se adopta una estrategia en capas con **Vitest** como único runner en el frontend:

- **Unitarios (Vitest):** Cobertura en `lib/crypto` (ya existente), `lib/import`, `lib/export`, `lib/password-generator` y stores; pruebas de cloud/APIs solo con mocks (sin OAuth ni llamadas reales a Drive/Dropbox).
- **Integración (Vitest):** Flujo cifrar vault → descifrar → mismo contenido (crypto + estructura de vault); roundtrip export CSV → import CSV para validar consistencia.
- **Regla:** Ningún test usa contraseñas reales ni tokens; solo datos de prueba fijos o generados (p. ej. `test-master-password`). HIBP, OAuth y APIs de almacenamiento se mockean o quedan fuera del alcance de estos tests.
- **Opcional / fases posteriores:** Tests de componentes (RTL) en pantallas críticas y E2E (Playwright) para 2–3 flujos de usuario; no forman parte del alcance inicial.

### Consecuencias

**Positivas:**
- Detección temprana de regresiones en crypto, import/export y modelo de datos.
- Confianza en refactorings sin exponer datos reales.
- Documentación ejecutable del comportamiento esperado (tests como especificación).

**Negativas:**
- Tiempo de implementación y mantenimiento cuando cambien interfaces o formatos.
- Los mocks pueden desacoplarse de la realidad si las APIs evolucionan (mitigación: tests del worker OAuth con Cloudflare Vitest pool ya cubren el proxy).

**Riesgos mitigados:**
- Cobertura de cifrado y KDF ya existente; los nuevos tests extienden import/export y password-generator sin duplicar lógica sensible.

---

## ADR-016: Manejo de errores y retry logic para APIs

**Estado:** Aceptado  
**Fecha:** 14 febrero 2025

### Contexto

La aplicación depende de varias APIs externas: almacenamiento en la nube (Google Drive, Dropbox), proxy OAuth (Cloudflare Worker que llama a Google/Dropbox para tokens) y Have I Been Pwned (verificación de contraseñas comprometidas). Los fallos de red, timeouts o respuestas 5xx/429 pueden ser transitorios; otros (4xx, datos inválidos) no. Se necesita una política común de manejo de errores y de cuándo tiene sentido reintentar, sin complicar en exceso la implementación ni la UX.

**Alternativas consideradas:**
1. Retry automático con backoff en todas las llamadas.
2. Sin retry; solo mensaje genérico y botón "Reintentar" manual.
3. Retry solo en operaciones críticas (guardar/cargar vault) y manual en el resto.
4. **Política unificada sin retry automático; mensajes por tipo; reintento manual; implementación en frontend y worker.** (elegida)

### Decisión

- **Alcance (A.4):** La política se aplica a **todas** las APIs: cloud (Drive/Dropbox), proxy OAuth y HIBP. Criterios y mensajes coherentes en todo el producto.

- **Retry (B.1):** **No** se implementa retry automático. Ante fallo se muestra mensaje y, cuando proceda, un botón **"Reintentar"** que vuelve a lanzar la operación. El usuario decide cuándo reintentar (p. ej. tras recuperar conexión).

- **Errores reintentables (C):** Se considera que **tiene sentido** ofrecer "Reintentar" cuando el fallo es potencialmente transitorio: error de red (sin conexión, timeout), respuestas 5xx (servicio no disponible) y 429 (demasiadas peticiones). **No** se considera reintentable: 4xx (400, 401, 403, 404), respuestas mal formadas o datos inválidos. El 401 en OAuth (token expirado) se trata con refresh de token cuando exista; si no, mensaje de sesión expirada y flujo de login de nuevo.

- **Mensajes al usuario (D.2):** Se muestran **mensajes según el tipo** de error, no un texto genérico único: sin conexión, servicio no disponible, demasiadas peticiones (429), sesión expirada (401). Objetivo: que el usuario entienda la causa y sepa si puede hacer algo (reconectar, esperar, volver a iniciar sesión).

- **Dónde se implementa (E.3):** En **frontend y worker**. En el frontend: manejo de errores y mensajes al llamar a cloud (Drive/Dropbox) y al proxy OAuth; botón "Reintentar" donde aplique. En el worker OAuth: manejo de errores al llamar a los proveedores (Google/Dropbox) y respuestas HTTP/cuerpo claros hacia el frontend para poder clasificar el error (5xx, 429, 401, etc.) y mostrar el mensaje adecuado.

### Consecuencias

**Positivas:**
- Comportamiento predecible en todas las integraciones con APIs.
- Usuario informado del tipo de fallo sin detalles técnicos innecesarios.
- Implementación sencilla (sin lógica de backoff ni colas de reintentos).
- Menor riesgo de doble escritura o efectos secundarios por reintentos automáticos.

**Negativas:**
- El usuario debe pulsar "Reintentar" manualmente; en entornos muy inestables puede resultar incómodo (se puede revisar en el futuro si se añade retry automático limitado en operaciones concretas).

**Riesgos mitigados:**
- Definir qué es "reintentable" permite ofrecer el botón "Reintentar" solo cuando es útil y mantener coherencia entre frontend y worker.

---

## Resumen de Decisiones

| ADR | Decisión | Impacto en TFM |
|-----|----------|----------------|
| 001 | Zero-knowledge con cloud usuario | ⭐⭐⭐ Core diferenciador |
| 002 | React + Vite | ⭐⭐ Stack moderno |
| 003 | Cloudflare Workers | ⭐⭐⭐ Serverless moderno |
| 004 | Google Drive + Dropbox | ⭐⭐ Integración APIs |
| 005 | Login OAuth directo | ⭐⭐⭐ Zero-knowledge puro |
| 006 | Argon2id + AES-GCM | ⭐⭐⭐ Seguridad best practices |
| 007 | Modelo híbrido seguridad | ⭐⭐ Flexibilidad UX |
| 008 | Vault unificado | ⭐⭐ Eficiencia |
| 009 | Folders no vaults | ⭐ Simplicidad MVP |
| 010 | Last-Write-Wins | ⭐⭐ Sync pragmático |
| 011 | PWA multiplataforma | ⭐⭐⭐ Un codebase |
| 012 | Sin base de datos | ⭐⭐⭐ Zero-knowledge verdadero |
| 013 | HIBP k-anonymity | ⭐⭐ Seguridad + privacidad |
| 014 | i18n multiidioma | ⭐⭐ Accesibilidad / alcance |
| 015 | Estrategia testing (Vitest unit + integración) | ⭐⭐ Calidad / TFM |
| 016 | Errores y retry APIs (manual, mensajes por tipo, frontend + worker) | ⭐⭐ UX / resiliencia |

---


## Conclusiones

Este proyecto demuestra una arquitectura **zero-knowledge verdadera** donde:
1. El backend nunca ve datos sensibles (contraseñas, metadata)
2. El usuario tiene control total de sus datos (almacenados en su cloud)
3. La criptografía sigue best practices de 2025 (Argon2id, AES-GCM)
4. La arquitectura es moderna (serverless, PWA, edge computing)
5. El costo operativo es $0 (Cloudflare free tier)

Cada decisión prioriza **seguridad** y **privacidad** sin comprometer la viabilidad técnica del proyecto académico.
