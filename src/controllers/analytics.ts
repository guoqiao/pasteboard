/**
 * Analytics Controller
 */
import express = require("express");
import analytics = require("../helpers/analytics");

const get: any = {};

get.views = (req: express.Request, res: express.Response) => {
  analytics.getTotalViews(`/${req.params.path}`, (err, views) => {
    if (err) return res.status(500).send(String(err));
    res.send({ views });
  });
};

export const routes = {
  get: {
    "views/:path": get.views,
  },
};