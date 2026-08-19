/**
 * Environment Configuration
 */
import * as path from "path";
import express = require("express");
import auth = require("../auth");
import { PUBLIC_DIR, VIEWS_DIR } from "../root";

export function init(app: express.Application, expressModule: typeof express): void {
  // General
  app.configure(() => {
    // Use
    app.use(expressModule.favicon(path.join(PUBLIC_DIR, "images", "favicon.ico")));
    app.use(expressModule.limit("10mb"));
    if (process.env.LOCAL) app.use(expressModule.logger("dev"));
    app.use(expressModule.cookieParser());
    app.use(expressModule.methodOverride());

    // Express 3 reads the removed response._headers property on modern Node.
    app.use((req: any, res: any, next: any) => {
      if (!("_headers" in res)) {
        Object.defineProperty(res, "_headers", {
          configurable: true,
          enumerable: false,
          get: () => res.getHeaders(),
        });
      }
      next();
    });

    app.use(app.router);
    app.use(expressModule.static(PUBLIC_DIR));

    // Set
    app.set("localrun", process.env.LOCAL || false);
    app.set("port", process.env.PORT || 3000);
    app.set("domain", "http://pasteboard.co");

    // Amazon S3 connection settings (using knox)
    if (auth.amazon) {
      const knox = require("knox");
      app.set(
        "knox",
        knox.createClient({
          key: auth.amazon.S3_KEY,
          secret: auth.amazon.S3_SECRET,
          bucket: auth.amazon.S3_BUCKET,
          region: "eu-west-1",
        })
      );

      app.set("amazonFilePath", `/${auth.amazon.S3_IMAGE_FOLDER}`);
    }

    // File storage options when not using Amazon S3
    app.set("localStorageFilePath", path.join(PUBLIC_DIR, "storage") + "/");
    app.set("localStorageURL", "/storage/");

    app.set("views", VIEWS_DIR);
    app.set("view engine", "ejs");
  });

  // Development
  app.configure("development", () => {
    // Use
    app.use(expressModule.errorHandler());

    // Set
    app.set("port", process.env.PORT || 4000);
    app.set("domain", "http://dev.pasteboard.co");
  });
}