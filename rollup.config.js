import typescript from "@rollup/plugin-typescript";
import terser from "@rollup/plugin-terser";

export default {
  input: "src/index.ts",
  output: [
    {
      dir: "dist",
      format: "es",
    },
    {
      file: "dist/index.umd.min.js",
      format: "umd",
      name: "CountUp",
      plugins: [terser()],
    },
    {
      file: "dist/index.min.js",
      format: "es",
      plugins: [terser()],
    },
  ],
  plugins: [
    typescript({
      tsconfig: "./tsconfig.json",
    }),
  ],
};
