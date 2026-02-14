/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GOOGLE_CLIENT_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module "libsodium-wrappers-sumo" {
  const sodium: {
    ready: Promise<void>;
    crypto_pwhash: (
      outputLength: number,
      password: string,
      salt: Uint8Array,
      opsLimit: number,
      memLimit: number,
      alg: number
    ) => Uint8Array;
    crypto_pwhash_ALG_ARGON2ID13: number;
    randombytes_buf: (length: number) => Uint8Array;
  };
  export default sodium;
}

declare module "reveal.js/dist/reveal.esm.js" {
  interface RevealApi {
    initialize(): Promise<void>;
    destroy(): void;
    layout(): void;
  }
  function Reveal(revealElement: HTMLElement | null, options?: Record<string, unknown>): RevealApi;
  export default Reveal;
}
