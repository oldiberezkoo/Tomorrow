import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/packages/env/index.ts"],
  format: ["esm"],
  target: "node18",
  splitting: false,
  clean: true,
  dts: false,
  external: ["readline/promises", "inspector/promises"],
  noExternal: [],
  outDir: "dist",
  esbuildOptions(options) {
    options.loader = {
      ...options.loader,
      ".md": "text",
      ".yaml": "text",
      ".yml": "text",
    };
    options.plugins = options.plugins || [];
  },
});
