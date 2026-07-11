import { defineConfig } from "tsdown";

export default defineConfig({
  entry: {
    "hyperliquid/index": "src/hyperliquid/index.ts",
  },
  format: ["esm"],
  fixedExtension: false,
  dts: { sourcemap: true },
  sourcemap: true,
});
