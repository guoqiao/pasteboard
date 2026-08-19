/**
 * Images Controller
 */
import * as fs from "fs";
import express = require("express");
import auth = require("../auth");
import helpers = require("../helpers/common");
import { jsonFetch, pipeRemote } from "../helpers/http";

const get: any = {};
const post: any = {};

// The image display page
export const index = get.index = (req: express.Request, res: express.Response) => {
  const viewData: any = {
    imageName: req.params.image,
    imageURL: helpers.imageURL(req, req.params.image),
    longURL: `${req.app.get("domain")}/${req.params.image}`,
    isImageOwner: helpers.isImageOwner(req, req.params.image),
  };

  res.render("image", viewData);
};

// Image download URL
get.download = (req: express.Request, res: express.Response) => {
  res.set("Content-Disposition", `attachment; filename=${req.params.image}`);
  pipeRemote(helpers.imageURL(req, req.params.image), res, {
    Referer: req.headers.referer,
  });
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
      jsonFetch(
        `https://api.cloudflare.com/client/v4/zones/${auth.cloudflare.ZONE_ID}/purge_cache`,
        {
          method: "DELETE",
          headers: {
            "X-Auth-Email": auth.cloudflare.EMAIL,
            "X-Auth-Key": auth.cloudflare.KEY,
          },
          body: {
            files: [helpers.imageURL(req, req.params.image)],
          },
        }
      ).catch((error) => {
        console.log("Cloudflare error", error);
      });
    }

    helpers.removeImageOwner(res, req.params.image);
    res.send("Success");
  }

  res.status(403).send("Forbidden");
};

export const routes = {
  get: {
    ":image/download": get.download,
  },
  post: {
    ":image/delete": post.delete,
  },
};
