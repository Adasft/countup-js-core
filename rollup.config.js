import typescript from "@rollup/plugin-typescript";
import terser from "@rollup/plugin-terser";

export default {
  input: "src/index.ts",
  output: [
    {
      file: "dist/countup-js-core.js",
      format: "es",
    },
    {
      file: "dist/countup-js-core.umd.min.js",
      format: "umd",
      name: "CountUp",
      plugins: [terser()],
    },
    {
      file: "dist/countup-js-core.min.js",
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
