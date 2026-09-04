import vinext from "vinext";
import { defineConfig } from "vite";

// macOS Seatbelt blocks FSEvents, so sandboxed previews need polling for HMR.
const isSandboxedPreview = process.env.CODEX_SANDBOX === "seatbelt";

const runtimeConfig = {
  main: "./worker/index.ts",
  compatibility_flags: ["nodejs_compat"],
};

export default defineConfig(async () => {
  // Keep Wrangler and Miniflare state project-local. Application secrets belong
  // in ignored `.env*` files and are injected at runtime.
  process.env.WRANGLER_WRITE_LOGS ??= "false";
  process.env.WRANGLER_LOG_PATH ??= ".wrangler/logs";
  process.env.MINIFLARE_REGISTRY_PATH ??= ".wrangler/registry";

  const { cloudflare } = await import("@cloudflare/vite-plugin");

  return {
    server: {
      host: "0.0.0.0",
      allowedHosts: ["terminal.local"],
      proxy: {
        "/api": {
          target: process.env.GO_API_URL ?? "http://127.0.0.1:8788",
          changeOrigin: false,
        },
      },
      ...(isSandboxedPreview
        ? { watch: { useFsEvents: false, usePolling: true } }
        : {}),
    },
    plugins: [
      vinext(),
      cloudflare({
        viteEnvironment: { name: "rsc", childEnvironments: ["ssr"] },
        inspectorPort: false,
        config: runtimeConfig,
      }),
    ],
  };
});
