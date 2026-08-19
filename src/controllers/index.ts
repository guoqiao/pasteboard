// Load all controllers
// Note: This is not a controller
import * as fs from "fs";
import * as path from "path";
import express = require("express");

const loaded: any = {};

export function init(app: express.Application): any {
  fs.readdirSync(__dirname).forEach((file) => {
    const controllerName = file.replace(/\.(coffee|js|ts)$/, "");
    if (controllerName !== "index") {
      const controller = require(path.join(__dirname, controllerName));
      if (controller.init) controller.init(app);
      loaded[controllerName] = controller;
    }
  });

  return loaded;
}