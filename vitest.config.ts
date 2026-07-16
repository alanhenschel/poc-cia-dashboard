import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/**
 * Vitest config. No @vitejs/plugin-react (its Babel 8 peer conflicts with the Babel 7 pulled in by
 * shadcn) — Vitest 4's built-in oxc transform handles TSX via the automatic JSX runtime, which is all
 * RTL needs.
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.{ts,tsx}"],
    restoreMocks: true,
    css: false,
  },
});
