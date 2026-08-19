import * as path from "path";

// The repository root. Source files live under src/ and compile to dist/,
// so going up one directory from this file's compiled location (dist/root.js)
// always reaches the project root.
export const ROOT_DIR = path.join(__dirname, "..");

export const AUTH_DIR = path.join(ROOT_DIR, "auth");
export const PUBLIC_DIR = path.join(ROOT_DIR, "public");
export const VIEWS_DIR = path.join(ROOT_DIR, "views");