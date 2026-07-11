import { defineConfig } from "tsdown";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    "components/index": "src/components/index.ts",
  },
  format: ["esm"],
  fixedExtension: false,
  dts: { sourcemap: true },
  sourcemap: true,
});
