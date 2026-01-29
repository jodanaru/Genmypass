#!/usr/bin/env node
/**
 * Crea symlink libsodium.mjs donde libsodium-wrappers ESM lo espera (pnpm).
 * Así tanto Vite como Vitest resuelven "./libsodium.mjs" sin alias.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const pnpm = path.join(root, "node_modules", ".pnpm");

function linkLibsodiumMjs(wrappersPkgDir, wrappersPkgName, libsodiumDir, subPath = "modules-esm", mjsName = "libsodium.mjs") {
  const linkPath = path.join(
    pnpm,
    wrappersPkgDir,
    "node_modules",
    wrappersPkgName,
    "dist",
    subPath,
    mjsName
  );
  const targetPath = path.join(
    pnpm,
    libsodiumDir,
    "node_modules",
    libsodiumDir.startsWith("libsodium-sumo") ? "libsodium-sumo" : "libsodium",
    "dist",
    subPath,
    mjsName
  );
  if (!fs.existsSync(targetPath)) return;
  const linkDir = path.dirname(linkPath);
  if (!fs.existsSync(linkDir)) return;
  try {
    if (fs.existsSync(linkPath)) fs.unlinkSync(linkPath);
    const relative = path.relative(linkDir, targetPath);
    fs.symlinkSync(relative, linkPath);
    console.log("[postinstall]", mjsName, "symlink created for", wrappersPkgName, "ESM");
  } catch (e) {
    console.warn("[postinstall] symlink skipped for", wrappersPkgName, ":", e.message);
  }
}

function main() {
  if (!fs.existsSync(pnpm)) return;
  const libsodiumDir = fs.readdirSync(pnpm).find((d) => d.startsWith("libsodium@") && !d.includes("wrappers"));
  const libsodiumSumoDir = fs.readdirSync(pnpm).find((d) => d === "libsodium-sumo@0.7.16" || d.startsWith("libsodium-sumo@"));

  if (libsodiumDir) {
    const wrappersDir = fs.readdirSync(pnpm).find((d) => d.startsWith("libsodium-wrappers@") && !d.includes("sumo"));
    if (wrappersDir) linkLibsodiumMjs(wrappersDir, "libsodium-wrappers", libsodiumDir);
  }
  if (libsodiumSumoDir) {
    const sumoWrappersDir = fs.readdirSync(pnpm).find((d) => d.startsWith("libsodium-wrappers-sumo@"));
    if (sumoWrappersDir) linkLibsodiumMjs(sumoWrappersDir, "libsodium-wrappers-sumo", libsodiumSumoDir, "modules-sumo-esm", "libsodium-sumo.mjs");
  }
}

main();
