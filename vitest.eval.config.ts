import { fileURLToPath } from "node:url"
import { defineConfig } from "vitest/config"

// Live evaluation against real providers. Needs a model key and a search
// provider in the environment; never part of `pnpm test`.
export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: { environment: "node", include: ["evals/**/*.eval.ts"], testTimeout: 180_000 },
})
