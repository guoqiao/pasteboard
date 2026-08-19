# AGENTS.md

## Project Context

Pasteboard is an image upload and sharing web application. This repository is a heavily modified fork of the original CoffeeScript project. The original codebase was out of maintenance; it has been rewritten in TypeScript and upgraded to Node.js 24 while preserving the main upload workflow and UI.

Do not reintroduce CoffeeScript tooling or assume that upstream Pasteboard documentation matches this repository. The canonical source is the TypeScript code in `src/` and `assets/js/`.

## Runtime And Commands

- Use Node.js 24 and npm. Use `npm ci` for a clean dependency install.
- `npm run build` compiles the server and browser code and generates the served asset bundles.
- `npm run build:server` compiles `src/` to `dist/`.
- `npm run build:client` compiles browser TypeScript, bundles JavaScript, and compiles LESS into `public/builtAssets/`.
- `npm run run-local` builds and starts with `LOCAL=true`. It listens on port `4000` by default because Express runs in development mode; set `PORT` to override it.
- `npm start` starts `dist/app.js` and requires a prior build. Use `NODE_ENV=production npm start` for the production port (`3000`) and defaults.
- `make run` builds and runs the ARM64 Docker image on port `3000`.
- `make rebuild` performs a cache-free ARM64 Docker build.

There is no automated test suite or test script at present. `npm run build` is the required baseline check. For upload-related changes, manually test clipboard or drag-and-drop upload, crop, image display, download, and owner deletion.

## Repository Layout

- `src/app.ts`: Express application bootstrap.
- `src/config/`: environment and route setup.
- `src/controllers/`: dynamically loaded route controllers. `main` owns root upload routes; `images` owns image-page, download, and delete routes.
- `src/helpers/`: URL, ownership, and HTTP helpers.
- `src/websocketserver.ts`: same-origin WebSocket connections and cleanup of temporary uploads.
- `src/scripts/build-assets.ts`: browser bundle and LESS build pipeline.
- `assets/js/`: browser TypeScript modules, including the upload state machine and image editor.
- `assets/css/`: LESS source.
- `views/`: EJS templates.
- `public/`: static assets and local image storage.
- `auth/`: optional runtime credential modules; real files are ignored and must never be committed.

## Build And Source Rules

- Server TypeScript uses strict checking, CommonJS output, and an ES2017 target from `tsconfig.json`.
- Browser TypeScript intentionally targets ES5 with `module: none` from `tsconfig.client.json`; the custom bundler supplies ordering and compatibility for the legacy browser UI.
- Edit source files, not generated files in `dist/`, `builtAssets/`, or `public/builtAssets/`.
- When adding or removing browser modules, update the explicit bundle order in `src/scripts/build-assets.ts`.
- Preserve the controller route convention in `src/config/routes.ts`: the `main` controller owns root paths, while other controller routes are prefixed unless their route starts with `/`.
- Keep changes focused and preserve existing upload behavior unless the task explicitly changes the contract.

## Configuration And Storage

- Local uploads are stored in `public/storage/` and are intentionally ignored by Git.
- S3 storage is enabled by `auth/amazon.js`; its configured `CDN_URL` or S3 URL is used for raw image links.
- `auth/hashing.js` supplies `keyHash(image)` for uploader ownership cookies. Without it, the UI cannot authorize deletion.
- `auth/cloudflare.js` is optional and is used to purge cached image URLs after deletion.
- `DOMAIN` controls canonical share URLs. `IMAGE_BASE_URL` controls the public base for local raw image files.
- Deployments behind TLS termination must forward `Host`, `X-Forwarded-Proto`, and WebSocket upgrades. WebSocket origin checks depend on these values.
- Never log, commit, or place credential contents in examples, tests, or generated output.

## Verification Checklist

Before handing off a change:

1. Run `npm run build`.
2. Check `git status` and do not include generated output, local storage, `node_modules`, or populated auth files.
3. Start the local app with `npm run run-local` when runtime behavior changed.
4. Verify the relevant browser workflow and confirm generated URLs use the intended host and protocol.
5. Update `README.md` when configuration, commands, deployment behavior, or user-visible functionality changes.
