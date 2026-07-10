import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    "hyperliquid/index": "src/hyperliquid/index.ts",
  },
  format: ["esm"],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: true,
  treeshake: true,
});
