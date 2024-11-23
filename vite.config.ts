import { resolve } from "path";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "unbound-control-ts",
      formats: ["es", "cjs"],
      fileName: (format) => {
        if (format === "es") return "index.mjs";
        if (format === "cjs") return "index.cjs";
        return "index.js";
      },
    },
    rollupOptions: {
      external: ["net", "fs", "path"],
      output: {
        dir: "dist",
      },
    },
  },
  plugins: [
    dts({
      tsconfigPath: "./tsconfig.json",
      rollupTypes: true,
      outDir: "dist",
    }),
  ],
});
