/**
 * Client asset build script.
 *
 * Replaces the old connect-assets pipeline. The client TypeScript modules
 * are compiled by tsc (tsconfig.client.json) into builtAssets/js, then this
 * script concatenates the vendor libraries and modules into the final bundles
 * (head.js, main.js, image.js) served by the app, and compiles the LESS
 * stylesheets into CSS.
 *
 * The client modules are written so that each file keeps its own scope
 * (module factory functions / IIFEs), mirroring the isolation CoffeeScript
 * used to provide per-file wrapping.
 *
 * Bundles are written to public/builtAssets so the existing express.static
 * middleware serves them directly.
 */
import * as fs from "fs";
import * as path from "path";
import { render as renderLess } from "less";
import { ROOT_DIR } from "../root";

const JS_SRC = path.join(ROOT_DIR, "assets", "js");
const LIB_DIR = path.join(JS_SRC, "lib");
const HEAD_DIR = path.join(JS_SRC, "head");
const COMPILED_DIR = path.join(ROOT_DIR, "builtAssets", "js");
const CSS_DIR = path.join(ROOT_DIR, "assets", "css");
const OUT_DIR = path.join(ROOT_DIR, "public", "builtAssets");

const read = (dir: string, file: string): string =>
  fs.readFileSync(path.join(dir, file), "utf8");

const readCompiled = (modulePath: string): string =>
  fs.readFileSync(path.join(COMPILED_DIR, `${modulePath}.js`), "utf8");

const writeBundle = (name: string, parts: string[]): void => {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, name), parts.join("\n\n"));
};

function buildJavaScriptBundles(): void {
  const jquery = read(LIB_DIR, "jquery.min.js");
  const transit = read(LIB_DIR, "jquery.transit.min.js");
  const canvasToBlob = read(LIB_DIR, "canvas-to-blob.min.js");
  const spin = read(LIB_DIR, "spin.min.js");
  const modernizr = read(HEAD_DIR, "modernizr.min.js");
  const prefixfree = read(HEAD_DIR, "prefixfree.min.js");

  // head.js - used in <head>, must not depend on jQuery
  writeBundle("head.js", [modernizr, prefixfree, readCompiled("head")]);

  // main.js - index page bundle. Order mirrors the old Sprockets directives:
  // libs first, then common, the module loader, every module, then main.
  const moduleOrder = [
    "common",
    "modules/moduleloader",
    "modules/analytics",
    "modules/appflow",
    "modules/copyandpaste",
    "modules/draganddrop",
    "modules/extensionhandler",
    "modules/filehandler",
    "modules/imageeditor",
    "modules/modalwindow",
    "modules/socketconnection",
    "modules/template",
    "modules/webcam",
  ];
  writeBundle("main.js", [
    jquery,
    transit,
    canvasToBlob,
    spin,
    ...moduleOrder.map((m) => readCompiled(m)),
    readCompiled("main"),
  ]);

  // image.js - uploaded image page bundle
  const imageModuleOrder = [
    "common",
    "modules/moduleloader",
    "modules/analytics",
    "modules/template",
    "modules/modalwindow",
  ];
  writeBundle("image.js", [
    jquery,
    transit,
    spin,
    ...imageModuleOrder.map((m) => readCompiled(m)),
    readCompiled("image"),
  ]);
}

async function buildCss(): Promise<void> {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  for (const name of ["main", "image"]) {
    const filename = path.join(CSS_DIR, `${name}.less`);
    const source = fs.readFileSync(filename, "utf8");
    const result = await renderLess(source, {
      paths: [CSS_DIR],
      filename,
    });
    fs.writeFileSync(path.join(OUT_DIR, `${name}.css`), result.css);
  }
}

async function main(): Promise<void> {
  buildJavaScriptBundles();
  await buildCss();
  console.log(`Client assets written to ${path.relative(ROOT_DIR, OUT_DIR)}`);
}

main().catch((err) => {
  console.error("Failed to build client assets:", err);
  process.exit(1);
});