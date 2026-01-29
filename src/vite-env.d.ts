/// <reference types="vite/client" />

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
