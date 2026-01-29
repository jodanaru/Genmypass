# Genmypass

Genmypass **zero-knowledge**: React + Vite + TypeScript. La clave maestra y los secretos nunca salen del dispositivo; el cifrado usa Argon2id (KDF) y AES-256-GCM.

## Stack

- **React 19** + **Vite 6** + **TypeScript** (strict)
- **Tailwind CSS v4** – tema oscuro (blues)
- **Zustand** – estado global
- **PWA** – vite-plugin-pwa (offline, installable)
- **Crypto**: libsodium (Argon2id) + Web Crypto API (AES-256-GCM)

## Estructura

```
src/
├── lib/crypto/          # Módulo crypto zero-knowledge
│   ├── types.ts
│   ├── utils.ts
│   ├── kdf.ts           # Argon2id (libsodium)
│   ├── encryption.ts    # AES-256-GCM (Web Crypto)
│   ├── index.ts
│   └── __tests__/
├── components/
├── pages/
├── stores/
├── App.tsx
├── main.tsx
└── index.css
```

## Desarrollo

```bash
pnpm install
pnpm dev
```

Abre [http://localhost:5173](http://localhost:5173). Favicon y logo se sirven desde `public/` (`/favicon.ico`, `/logo.png`).

## Build y PWA

```bash
pnpm build
pnpm preview
```

El build genera una PWA con service worker y manifest (tema oscuro, iconos desde `public/`).

## Tests

```bash
pnpm test        # watch
pnpm test:run    # una sola ejecución
```

## Configuración

- **TypeScript**: `strict`, `noUncheckedIndexedAccess` en `tsconfig.json`.
- **Vite**: alias `@/` → `src/`, PWA en `vite.config.ts`.
- **Tailwind**: tema oscuro y paleta primary (blues) en `tailwind.config.js` y variables en `src/index.css`.

## Licencia

Véase [LICENSE](LICENSE).
