/**
 * Authentication configuration loader.
 *
 * Reads the optional per-credential modules from the repository-root auth/
 * folder. Files such as auth/amazon.js only exist when the operator has
 * configured them; everything is optional.
 */
import * as path from "path";
import { AUTH_DIR } from "../root";

const authFiles = ["amazon", "hashing", "cloudflare"];

const auth: any = {};

for (const name of authFiles) {
  try {
    auth[name] = require(path.join(AUTH_DIR, `${name}.js`));
  } catch (err) {
    console.log(`Missing (optional) auth file: auth/${name}.js`);
  }
}

export = auth;
