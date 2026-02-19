# Genmypass

**Gestor de contraseñas zero-knowledge.** Tus contraseñas, cifradas en tu nube.

Genmypass es un gestor de contraseñas de código abierto que aplica una arquitectura **zero-knowledge real**: la clave maestra y los secretos nunca abandonan el dispositivo del usuario. Todo el cifrado (Argon2id + AES-256-GCM) ocurre en el navegador, y la bóveda cifrada se almacena exclusivamente en el almacenamiento en la nube personal del usuario (Google Drive o Dropbox). No hay servidores propios que almacenen datos sensibles; el único componente de backend es un proxy OAuth ligero desplegado como Cloudflare Worker, cuyo coste operativo es **$0/mes**.

A diferencia de gestores tradicionales como LastPass o Bitwarden, donde la bóveda reside en servidores de la empresa, Genmypass elimina ese punto único de fallo: los datos están en **tu nube**, bajo **tu control**.

> **URL del proyecto en producción:** [https://genmypass.app](https://genmypass.app)
>
> **Presentación (slides):** [https://genmypass.app/slides](https://genmypass.app/slides)
>
> **Repositorio:** [https://github.com/jodanaru/Genmypass](https://github.com/jodanaru/Genmypass)

---

## Stack tecnológico

### Frontend

| Tecnología | Versión | Propósito |
|---|---|---|
| **React** | 19 | Librería de UI |
| **Vite** | 6 | Build tool y dev server |
| **TypeScript** | 5.6 (strict) | Tipado estático |
| **Tailwind CSS** | 4 | Estilos utility-first |
| **Zustand** | 5 | Estado global ligero |
| **React Router** | 7 | Enrutamiento SPA |
| **i18next** + **react-i18next** | 25 / 16 | Internacionalización (ES + EN) |
| **Lucide React** | 0.563 | Iconografía |
| **Reveal.js** | 5 | Presentación interactiva (slides) |
| **vite-plugin-pwa** | 0.21 | PWA con Service Worker y Workbox |

### Criptografía

| Tecnología | Propósito |
|---|---|
| **libsodium** (libsodium-wrappers-sumo) | Argon2id — derivación de clave (KDF) |
| **Web Crypto API** (nativa del navegador) | AES-256-GCM — cifrado autenticado |
| **HIBP API** con k-anonymity | Verificación de contraseñas filtradas |

### Backend / Infraestructura

| Tecnología | Propósito |
|---|---|
| **Cloudflare Workers** | Proxy OAuth (intercambio y renovación de tokens) |
| **Hostinger** | Hosting del frontend estático |
| **Google Drive API v3** | Almacenamiento del vault cifrado (appDataFolder) |
| **Dropbox API v2** | Almacenamiento alternativo del vault cifrado |

### Testing

| Tecnología | Propósito |
|---|---|
| **Vitest** | Tests unitarios y de integración |
| **jsdom** | Entorno DOM para tests |

---

## Instalación y ejecución

### Requisitos previos

- **Node.js** ≥ 18
- **pnpm** ≥ 9.15

### Instalación

```bash
git clone https://github.com/jodanaru/Genmypass.git
cd Genmypass
pnpm install
```

El script `postinstall` configura automáticamente libsodium.

### Desarrollo local

```bash
pnpm dev
```

La aplicación estará disponible en [http://localhost:5173](http://localhost:5173).

Para levantar también el worker OAuth en local:

```bash
pnpm dev:worker
```

El worker escuchará en `http://localhost:8787` y Vite lo proxea automáticamente bajo `/api`.

### Variables de entorno

Copia `.env.example` a `.env.local` y define las siguientes variables:

| Variable | Descripción |
|---|---|
| `VITE_GOOGLE_CLIENT_ID` | Client ID de la app en Google Cloud Console |
| `VITE_DROPBOX_CLIENT_ID` | Client ID de la app en Dropbox Developers |
| `VITE_OAUTH_PROXY_URL` | URL del worker que intercambia tokens OAuth |

El worker (`workers/oauth-proxy/`) necesita sus propios secrets en Cloudflare:

- **Google:** `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- **Dropbox:** `DROPBOX_CLIENT_ID`, `DROPBOX_CLIENT_SECRET`

Configúralos con `wrangler secret put <NOMBRE>` desde la carpeta del worker.

### Build de producción

```bash
pnpm build
pnpm preview
```

Genera una PWA con Service Worker, Web App Manifest y precaching de assets estáticos.

### Tests

```bash
pnpm test          # modo watch
pnpm test:run      # ejecución única
```

Tests existentes cubren: módulo criptográfico (KDF, cifrado/descifrado, utilidades), stores (vault, settings) y API HIBP.

---

## Estructura del proyecto

```
Genmypass/
├── public/                          # Assets estáticos (favicon, logo, .htaccess)
├── scripts/
│   └── postinstall-libsodium.mjs    # Configuración post-instalación de libsodium
├── src/
│   ├── components/
│   │   ├── layout/                  # VaultAppLayout, BottomNav, ThemeAndLanguageBar
│   │   ├── onboarding/             # OnboardingProgress
│   │   ├── settings/               # AuditResultCard, ExportWarningModal
│   │   ├── vault/                  # PasswordCard, BreachWarning, FolderChips
│   │   ├── FlushOfflineQueue.tsx   # Reintento de sincronización pendiente
│   │   ├── OfflineGuard.tsx        # Redirección a /offline sin conexión
│   │   └── PendingSyncBanner.tsx   # Banner de cambios sin sincronizar
│   ├── hooks/
│   │   ├── useAutoLock.ts          # Bloqueo automático por inactividad
│   │   ├── useClipboard.ts         # Copiar al portapapeles con auto-limpieza
│   │   ├── useOnlineStatus.ts      # Detección de estado de conexión
│   │   └── useVault.ts             # Carga, descifrado y guardado del vault
│   ├── lib/
│   │   ├── crypto/                 # Módulo criptográfico zero-knowledge
│   │   │   ├── kdf.ts              #   Argon2id (libsodium)
│   │   │   ├── encryption.ts       #   AES-256-GCM (Web Crypto)
│   │   │   ├── types.ts            #   Tipos compartidos
│   │   │   ├── utils.ts            #   Salt, IV, Base64, random bytes
│   │   │   └── __tests__/          #   Tests unitarios
│   │   ├── cloud-storage/          # Abstracción de proveedores de nube
│   │   │   ├── google-drive/       #   Google Drive API v3
│   │   │   ├── dropbox/            #   Dropbox API v2
│   │   │   ├── pkce.ts             #   PKCE (RFC 7636) para OAuth
│   │   │   ├── token-manager.ts    #   Gestión y renovación de tokens
│   │   │   ├── provider-factory.ts #   Factory pattern para proveedores
│   │   │   └── vault-helpers.ts    #   Lectura/escritura del vault en la nube
│   │   ├── hibp/                   # Have I Been Pwned (k-anonymity)
│   │   ├── import/                 # Importación multi-formato
│   │   ├── export/                 # Exportación cifrada y CSV
│   │   ├── password-generator.ts   # Generador criptográfico de contraseñas
│   │   ├── api-errors.ts           # Clasificación de errores de API
│   │   ├── category-colors.ts      # Colores de categorías
│   │   ├── clear-vault-data.ts     # Limpieza segura de datos
│   │   └── format-relative.ts      # Formateo de fechas relativas
│   ├── locales/
│   │   ├── es.json                 # Traducciones español
│   │   └── en.json                 # Traducciones inglés
│   ├── pages/
│   │   ├── Landing.tsx             # Página de inicio
│   │   ├── SlidesPage.tsx          # Presentación TFM (Reveal.js)
│   │   ├── onboarding/            # Flujo de configuración inicial
│   │   │   ├── ConnectCloudPage    #   Conexión con Google Drive / Dropbox
│   │   │   ├── SetupPasswordPage   #   Creación de contraseña maestra
│   │   │   ├── SetupSecurityModePage # Elección de modo de seguridad
│   │   │   ├── SetupSecretKeyPage  #   Generación de clave secreta (dual-key)
│   │   │   └── AuthCallbackPage    #   Callback OAuth
│   │   ├── vault/                  # Gestión de contraseñas
│   │   │   ├── VaultPage           #   Listado principal
│   │   │   ├── EntryDetailPage     #   Detalle de una entrada
│   │   │   ├── EntryFormPage       #   Crear / editar entrada
│   │   │   ├── GeneratorPage       #   Generador de contraseñas
│   │   │   └── SearchPage          #   Búsqueda de credenciales
│   │   ├── settings/              # Configuración
│   │   │   ├── SettingsPage        #   Panel principal de ajustes
│   │   │   ├── ChangePasswordPage  #   Cambio de contraseña maestra
│   │   │   ├── FoldersPage         #   Gestión de categorías
│   │   │   ├── SecurityAuditPage   #   Auditoría de seguridad (HIBP)
│   │   │   ├── ImportPage          #   Importación de datos
│   │   │   └── ExportPage          #   Exportación de datos
│   │   ├── slides/                # Contenido y estilos de la presentación
│   │   └── special/               # Páginas especiales
│   │       ├── LockScreenPage      #   Pantalla de bloqueo
│   │       ├── OfflinePage         #   Modo sin conexión
│   │       ├── ErrorPage           #   Error genérico
│   │       └── PrivacyPolicyPage   #   Política de privacidad
│   ├── router/                    # Configuración de rutas (lazy loading)
│   ├── stores/                    # Estado global (Zustand)
│   │   ├── auth-store.ts          #   Master key y estado de desbloqueo
│   │   ├── vault-store.ts         #   Vault, entries, folders
│   │   ├── settings-store.ts      #   Preferencias del usuario
│   │   ├── offline-queue-store.ts #   Cola de sincronización offline
│   │   └── __tests__/             #   Tests de stores
│   ├── App.tsx                    # Componente raíz
│   ├── main.tsx                   # Entry point
│   ├── i18n.ts                    # Configuración i18next
│   └── index.css                  # Estilos globales y variables Tailwind
├── workers/
│   └── oauth-proxy/               # Cloudflare Worker — Proxy OAuth
│       ├── src/index.ts           #   Endpoints: token, refresh (Google + Dropbox)
│       ├── test/                  #   Tests del worker
│       └── wrangler.jsonc         #   Configuración de despliegue
├── TFM/
│   └── ADR.md                     # Architecture Decision Records (16 ADRs)
├── .env.example                   # Plantilla de variables de entorno
├── index.html                     # HTML raíz
├── vite.config.ts                 # Configuración Vite + PWA
├── vitest.config.ts               # Configuración de tests
├── tailwind.config.js             # Configuración Tailwind CSS
├── tsconfig.json                  # TypeScript (strict, noUncheckedIndexedAccess)
├── LICENSE                        # MIT
└── package.json
```

---

## Funcionalidades principales

### Seguridad y criptografía

- **Cifrado zero-knowledge**: toda la criptografía ocurre en el navegador; la clave maestra nunca sale del dispositivo.
- **Argon2id (KDF)**: derivación de clave con 64 MiB de memoria y 3 iteraciones (parámetros OWASP 2025), resistente a ataques con GPU y ASICs.
- **AES-256-GCM**: cifrado autenticado (AEAD) con nonce aleatorio de 12 bytes y tag de 16 bytes. Implementado con la Web Crypto API nativa (aceleración hardware).
- **Modelo de seguridad híbrido**: el usuario elige entre «solo contraseña maestra» (por defecto) o «doble llave» (contraseña + clave secreta local) para protección adicional contra compromisos de la contraseña.
- **Auditoría de seguridad (HIBP)**: escaneo de contraseñas contra filtraciones de datos conocidas mediante la API de Have I Been Pwned con k-anonymity; solo se envía un prefijo de 5 caracteres del hash SHA-1, la contraseña nunca abandona el dispositivo.
- **Bloqueo automático**: la bóveda se bloquea tras un periodo configurable de inactividad (1, 5, 15 minutos o nunca).
- **Limpieza de portapapeles**: las contraseñas copiadas se eliminan automáticamente del portapapeles tras 30 segundos.

### Gestión de contraseñas

- **Bóveda cifrada**: listado de credenciales con título, usuario, contraseña, URL, notas y fecha de uso.
- **Generador de contraseñas criptográfico**: longitud configurable (8–64), con opciones de mayúsculas, minúsculas, números, símbolos, exclusión de caracteres ambiguos y control de duplicados. Usa `crypto.getRandomValues` para aleatoriedad real.
- **Medidor de fortaleza**: evaluación visual en 4 niveles (débil, aceptable, buena, fuerte) basada en longitud y diversidad de caracteres.
- **Categorías con colores**: organización de entradas en carpetas personalizables con asignación de colores.
- **Favoritos**: marcado rápido de entradas para acceso prioritario.
- **Búsqueda**: filtrado de credenciales por nombre, usuario o URL.
- **Cambio de contraseña maestra**: re-cifrado completo de la bóveda con la nueva clave.

### Almacenamiento en la nube

- **Google Drive** (appDataFolder oculto, 15 GB gratuitos) y **Dropbox** (App Folder) como proveedores.
- **Autenticación OAuth 2.0 con PKCE** (RFC 7636): sin usuarios propios, sin base de datos; el backend solo actúa como proxy para proteger el `client_secret`.
- **Sincronización multi-dispositivo**: la bóveda cifrada se lee y escribe en la nube personal del usuario.
- **Cola de sincronización offline**: si la escritura falla por falta de conexión, los cambios se encolan y se reintentan al recuperar la red.

### Importación y exportación

- **Importar** desde múltiples formatos:
  - Backup cifrado de Genmypass (`.genmypass`)
  - Bitwarden (JSON)
  - LastPass (CSV)
  - 1Password (CSV) — con soporte multiidioma de cabeceras
  - CSV genérico
- **Exportar**:
  - Backup cifrado (`.genmypass`) — protegido con la contraseña maestra
  - CSV en texto plano — solo para migración a otro gestor
- Detección automática de formato de archivo al importar.
- Modos de importación: fusionar con existentes o reemplazar todo.

### PWA y experiencia de usuario

- **PWA instalable**: Web App Manifest, Service Worker con Workbox y precaching para funcionamiento offline.
- **Tema claro y oscuro**: alternancia manual desde cualquier pantalla.
- **Multiidioma**: español e inglés completos con detección automática del idioma del navegador y cambio manual.
- **Diseño responsive**: optimizado para móvil y escritorio.
- **Lazy loading**: todas las páginas se cargan bajo demanda para minimizar el bundle inicial.
- **Política de privacidad**: página dedicada conforme al RGPD.
- **Manejo de errores**: mensajes contextuales según el tipo de fallo (red, servicio, sesión) con opción de reintento manual.

### Presentación del TFM

La presentación (slides) del proyecto está integrada en la propia aplicación usando Reveal.js y es accesible en la ruta `/slides`. Incluye 11 diapositivas interactivas con soporte para tema claro/oscuro y multiidioma.

---

## Despliegue

| Componente | Plataforma | URL |
|---|---|---|
| **Frontend (PWA)** | Hostinger | [https://genmypass.app](https://genmypass.app) |
| **Proxy OAuth** | Cloudflare Workers | Worker privado (free tier) |
| **Presentación** | Integrada en la app | [https://genmypass.app/slides](https://genmypass.app/slides) |

El coste operativo total del proyecto es **$0/mes** gracias al free tier de Cloudflare Workers (100.000 peticiones/día) y el hosting estático en Hostinger.

---

## Decisiones de arquitectura

Las decisiones técnicas del proyecto están documentadas en **16 Architecture Decision Records (ADR)** en [`TFM/ADR.md`](TFM/ADR.md). Los puntos clave:

| ADR | Decisión |
|---|---|
| 001 | Modelo zero-knowledge con almacenamiento en cloud del usuario |
| 002 | React 19 + Vite 6 + TypeScript como stack frontend |
| 003 | Arquitectura serverless con Cloudflare Workers |
| 004 | Google Drive como proveedor primario, Dropbox como secundario |
| 005 | Login directo con OAuth, sin usuarios propios |
| 006 | Argon2id + AES-256-GCM como stack criptográfico |
| 007 | Modelo híbrido de seguridad (password-only o dual-key) |
| 008 | Vault unificado en un solo archivo cifrado |
| 009 | Carpetas (folders) dentro del vault en lugar de vaults múltiples |
| 010 | Sincronización multi-dispositivo con Last-Write-Wins |
| 011 | PWA como solución multiplataforma |
| 012 | Sin base de datos en el backend |
| 013 | HIBP con k-anonymity para verificación de contraseñas |
| 014 | Soporte multiidioma con i18next |
| 015 | Estrategia de testing con Vitest (unitarios + integración) |
| 016 | Manejo de errores y retry manual para APIs |

---

## Autor

**David Navarro**

TFM · Máster en Desarrollo con IA · Febrero 2025

---

## Licencia

Este proyecto está bajo la licencia [MIT](LICENSE).
