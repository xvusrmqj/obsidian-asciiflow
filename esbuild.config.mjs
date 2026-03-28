import esbuild from "esbuild";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isWatch = process.argv.includes("--watch");

const config = {
  entryPoints: ["src/main.tsx"],
  bundle: true,
  format: "cjs",
  target: "es2018",
  platform: "browser",
  outfile: "main.js",
  external: ["obsidian"],
  sourcemap: true,
  minify: !isWatch,
  logLevel: "info"
};

if (isWatch) {
  const ctx = await esbuild.context(config);
  await ctx.watch();
  console.log("Watching for changes...");
} else {
  await esbuild.build(config);
  console.log("Build complete");
}
