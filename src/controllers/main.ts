/**
 * Main (Index) Controller
 */
import * as fs from "fs-extra";
import async = require("async");
import express = require("express");
import formidable = require("formidable");
import auth = require("../auth");
import helpers = require("../helpers/common");
import { pipeRemote } from "../helpers/http";
import uaParser = require("ua-parser");

const FILE_SIZE_LIMIT = 10 * 1024 * 1024; // 10 MB

const get: any = {};
const post: any = {};

// The index page
get.index = (req: express.Request, res: express.Response) => {
  const viewData: any = {
    port: req.app.get("port"),
    redirected: false,
    useAnalytics: false,
    trackingCode: "",
    browser: uaParser.parseUA(req.headers["user-agent"]).family,
    uploads: [],
  };

  // Use Google Analytics when not running locally
  if (!req.app.get("localrun") && auth.google_analytics) {
    viewData.useAnalytics = true;
    viewData.trackingCode =
      req.app.settings.env === "development"
        ? auth.google_analytics.development
        : auth.google_analytics.production;
  }

  // Check cookies for recent uploads
  for (const name of Object.keys(req.cookies || {})) {
    if (!/^pb_/.test(name)) continue;
    const image = name.replace("pb_", "");

    viewData.uploads.push({
      link: image,
      raw: helpers.imageURL(req, image),
    });
  }

  // Show a welcome banner for redirects from PasteShack
  if (req.cookies.redirected) {
    viewData.redirected = true;
    res.clearCookie("redirected");
  }

  res.render("index", viewData);
};

// Handle redirects from PasteShack
get.redirected = (req: express.Request, res: express.Response) => {
  res.cookie("redirected", true);
  res.redirect("/");
};

// Proxy for external images, used to get around
// cross origin restrictions
get.imageProxy = (req: express.Request, res: express.Response) => {
  try {
    pipeRemote(decodeURIComponent(req.params.image), res);
  } catch (e) {
    res.status(500).send("Failure");
  }
};

// Preuploads an image and stores it in /tmp
post.preupload = (req: express.Request, res: express.Response) => {
  const form = new formidable.IncomingForm();
  const incomingFiles: formidable.File[] = [];

  form.on("fileBegin", (name, file) => {
    incomingFiles.push(file);
  });

  form.on("aborted", () => {
    // Remove temporary files that were in the process of uploading
    for (const file of incomingFiles) {
      fs.unlink(file.filepath, () => undefined);
    }
  });

  form.parse(req, (err, fields, files) => {
    const client = req.app.get("clients")[fields.id];
    if (client) {
      // Remove the old file
      if (client.file) fs.unlink(client.file.filepath, () => undefined);
      client.file = files.file;
    }

    res.send("Received file");
  });
};

// Upload the file to the cloud (or to a local folder).
// If the file has been preuploaded, upload that, else
// upload the file that should have been posted with the
// request.
post.upload = (req: express.Request, res: express.Response) => {
  const form = new formidable.IncomingForm();
  const knox = req.app.get("knox");
  const incomingFiles: formidable.File[] = [];

  form.parse(req, (err, fields, files) => {
    const client = fields.id ? req.app.get("clients")[fields.id] : undefined;

    // Check for either a posted or preuploaded file
    let file: formidable.File | undefined;
    if (files.file) {
      file = files.file;
    } else if (client && client.file && !client.uploading[client.file.filepath]) {
      file = client.file;
      client.uploading[file!.filepath] = true;
    }

    if (!file) {
      console.log("Missing file");
      return res.status(500).send("Missing file");
    }

    if (file.size > FILE_SIZE_LIMIT) {
      console.log("File too large");
      return res.status(500).send("File too large");
    }

    const fileName = helpers.generateFileName(file.mimetype.replace("image/", ""));
    const domain = req.app.get("localrun")
      ? `${helpers.requestProtocol(req)}://${req.headers.host}`
      : req.app.get("domain");
    const longURL = `${domain}/${fileName}`;
    let sourcePath = file.filepath;

    const parallels: any = {};
    if (knox) {
      // Upload to amazon
      parallels.upload = (callback: (err: any, res?: any) => void) => {
        knox.putFile(
          sourcePath,
          `${req.app.get("amazonFilePath")}${fileName}`,
          {
            "Content-Type": file!.mimetype,
            "x-amz-acl": "private",
          },
          callback
        );
      };
    } else {
      // Upload to local file storage
      parallels.upload = (callback: (err?: Error) => void) => {
        fs.move(sourcePath, `${req.app.get("localStorageFilePath")}${fileName}`, callback);
      };
    }

    const series: ((callback: (err?: any) => void) => void)[] = [];
    if (fields.cropImage) {
      series.push((callback) => {
        const cropPath = `/tmp/${fileName}`;
        const easyimage = require("easyimage");
        easyimage.crop(
          {
            src: sourcePath,
            dst: cropPath,
            cropwidth: fields["crop[width]"],
            cropheight: fields["crop[height]"],
            x: fields["crop[x]"],
            y: fields["crop[y]"],
            gravity: "NorthWest",
          },
          () => {
            fs.unlink(sourcePath, () => undefined);
            sourcePath = cropPath;
            callback(null);
          }
        );
      });
    }

    series.push((callback) => {
      async.parallel(parallels, (err) => {
        if (err) {
          console.log(err);
          return res.status(500).send("Failed to upload file");
        }

        fs.unlink(sourcePath, () => undefined);
        helpers.setImageOwner(res, fileName);
        res.json({ url: longURL });
        callback(null);
      });
    });

    async.series(series);
  });

  form.on("fileBegin", (name, file) => {
    incomingFiles.push(file);
  });

  form.on("aborted", () => {
    // Remove temporary files that were in the process of uploading
    for (const incomingFile of incomingFiles) {
      fs.unlink(incomingFile.filepath, () => undefined);
    }
  });
};

// Remove a preuploaded file from the given client ID, called
// whenever an image is discarded or the user leaves the site
post.clearfile = (req: express.Request, res: express.Response) => {
  const form = new formidable.IncomingForm();
  form.parse(req, (err, fields) => {
    const client = req.app.get("clients")[fields.id];
    if (client && client.file) {
      fs.unlink(client.file.filepath, () => undefined);
      client.file = null;
    }
    res.send("Cleared");
  });
};

export const routes = {
  get: {
    "": get.index,
    redirected: get.redirected,
    "imageproxy/:image": get.imageProxy,
  },
  post: {
    upload: post.upload,
    clearfile: post.clearfile,
    preupload: post.preupload,
  },
};
