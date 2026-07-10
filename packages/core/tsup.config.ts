import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    "client/index": "src/client/index.ts",
    "actions/index": "src/actions/index.ts",
    "math/index": "src/math/index.ts",
    "format/index": "src/format/index.ts",
    "contract/index": "src/contract/index.ts",
    "decimal/index": "src/decimal/index.ts",
    "testing/index": "src/testing/index.ts",
  },
  format: ["esm"],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: true,
  treeshake: true,
});
