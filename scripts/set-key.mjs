#!/usr/bin/env node
/**
 * Interactive key setup. Prompts for the Jev API key (input hidden), then:
 *   - writes JEV_MODE=api + JEV_API_KEY to .env.local (local dev)
 *   - with --vercel, also sets them on the Vercel production environment
 * The key never appears in shell history or chat.
 */
import { writeFileSync, readFileSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";

const toVercel = process.argv.includes("--vercel");

function askHidden(prompt) {
  return new Promise((resolve) => {
    process.stdout.write(prompt);
    const stdin = process.stdin;
    let buf = "";
    const wasRaw = stdin.isRaw;
    if (stdin.isTTY) stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding("utf8");
    const onData = (ch) => {
      for (const c of ch) {
        const code = c.charCodeAt(0);
        if (c === "\r" || c === "\n") {
          stdin.removeListener("data", onData);
          if (stdin.isTTY) stdin.setRawMode(Boolean(wasRaw));
          stdin.pause();
          process.stdout.write("\n");
          resolve(buf.trim());
          return;
        }
        if (code === 3) process.exit(130); // ctrl-c
        if (code === 127 || code === 8) buf = buf.slice(0, -1);
        else if (code >= 32) buf += c;
      }
    };
    stdin.on("data", onData);
  });
}

const key = await askHidden("Jev API key (hidden, press Enter when done): ");
if (!key) {
  console.error("No key entered. Nothing changed.");
  process.exit(1);
}
if (!/^[A-Za-z0-9_\-.]{16,}$/.test(key)) {
  console.error("That doesn't look like an API key (unexpected characters or too short). Nothing changed.");
  process.exit(1);
}

// .env.local: replace or append
let env = existsSync(".env.local") ? readFileSync(".env.local", "utf8") : "";
const set = (k, v) => {
  const re = new RegExp(`^${k}=.*$`, "m");
  if (re.test(env)) env = env.replace(re, `${k}=${v}`);
  else env += (env.endsWith("\n") || !env ? "" : "\n") + `${k}=${v}\n`;
};
set("JEV_MODE", "api");
set("JEV_API_KEY", key);
writeFileSync(".env.local", env);
console.log("✓ .env.local updated (JEV_MODE=api, JEV_API_KEY=****" + key.slice(-4) + ")");

if (toVercel) {
  const cleanEnv = { ...process.env };
  for (const k of ["HTTP_PROXY", "HTTPS_PROXY", "http_proxy", "https_proxy"]) delete cleanEnv[k];
  const run = (name, value) => {
    spawnSync("vercel", ["env", "rm", name, "production", "--yes"], { env: cleanEnv, stdio: "ignore" });
    const r = spawnSync("vercel", ["env", "add", name, "production"], { env: cleanEnv, input: value + "\n", encoding: "utf8" });
    if (r.status !== 0) {
      console.error(`✗ vercel env add ${name} failed:\n${r.stderr || r.stdout}`);
      process.exit(1);
    }
    console.log(`✓ Vercel production env ${name} set`);
  };
  run("JEV_MODE", "api");
  run("JEV_API_KEY", key);
  console.log("Done. Redeploy with: npm run deploy");
}
