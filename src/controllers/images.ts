/**
 * Images Controller
 */
import * as fs from "fs";
import express = require("express");
import request = require("request");
import auth = require("../auth");
import helpers = require("../helpers/common");

const get: any = {};
const post: any = {};

// The image display page
export const index = get.index = (req: express.Request, res: express.Response) => {
  const viewData: any = {
    imageName: req.params.image,
    imageURL: helpers.imageURL(req, req.params.image),
    longURL: `${req.app.get("domain")}/${req.params.image}`,
    useAnalytics: false,
    trackingCode: "",
    isImageOwner: helpers.isImageOwner(req, req.params.image),
  };

  // Use Google Analytics when not running locally
  if (!req.app.get("localrun") && auth.google_analytics) {
    viewData.useAnalytics = true;
    viewData.trackingCode =
      req.app.settings.env === "development"
        ? auth.google_analytics.development
        : auth.google_analytics.production;
  }

  res.render("image", viewData);
};

// Image download URL
get.download = (req: express.Request, res: express.Response) => {
  const imageRequest = request({
    url: helpers.imageURL(req, req.params.image),
    headers: {
      Referer: req.headers.referer,
    },
  });

  res.set("Content-Disposition", `attachment; filename=${req.params.image}`);
  imageRequest.pipe(res);
};

// Delete the image
post.delete = (req: express.Request, res: express.Response) => {
  if (helpers.isImageOwner(req, req.params.image)) {
    const knox = req.app.get("knox");
    if (knox) {
      knox.deleteFile(`${req.app.get("amazonFilePath")}${req.params.image}`, () => undefined);
    } else {
      const localPath = `${req.app.get("localStorageFilePath")}${req.params.image}`;
      fs.unlink(localPath, () => undefined);
    }

    if (auth.cloudflare) {
      const params: request.Options = {
        url: `https://api.cloudflare.com/client/v4/zones/${auth.cloudflare.ZONE_ID}/purge_cache`,
        json: true,
        headers: {
          "X-Auth-Email": auth.cloudflare.EMAIL,
          "X-Auth-Key": auth.cloudflare.KEY,
        },
        body: {
          files: [helpers.imageURL(req, req.params.image)],
        },
      };

      request.del(params, (error) => {
        if (error) console.log("Cloudflare error", error);
      });
    }

    helpers.removeImageOwner(res, req.params.image);
    res.send("Success");
  }

  res.send("Forbidden", 403);
};

export const routes = {
  get: {
    ":image/download": get.download,
  },
  post: {
    ":image/delete": post.delete,
  },
};