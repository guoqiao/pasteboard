/**
 * Environment Configuration
 */
import * as path from "path";
import express = require("express");
import morgan = require("morgan");
import cookieParser = require("cookie-parser");
import methodOverride = require("method-override");
import serveFavicon = require("serve-favicon");
import auth = require("../auth");
import { PUBLIC_DIR, VIEWS_DIR } from "../root";

export function init(app: express.Application): void {
  // Use
  app.use(serveFavicon(path.join(PUBLIC_DIR, "images", "favicon.ico")));
  if (process.env.LOCAL) app.use(morgan("dev"));
  app.use(cookieParser());
  app.use(methodOverride());
  app.use(express.static(PUBLIC_DIR));

  // Set
  app.set("localrun", process.env.LOCAL || false);
  app.set("port", process.env.PORT || 3000);
  // Canonical host for share/image-page URLs, e.g. "https://pb.guoqiao.me".
  app.set("domain", process.env.DOMAIN || "http://pasteboard.co");

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

  // Development
  if (app.get("env") === "development") {
    app.set("port", process.env.PORT || 4000);
    app.set("domain", process.env.DOMAIN || "http://dev.pasteboard.co");
  }
}
