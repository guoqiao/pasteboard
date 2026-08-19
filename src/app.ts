/**
 * Express Bootstrap
 */
import express = require("express");
import errorHandler = require("errorhandler");
import { init as initEnvironments } from "./config/environments";
import { init as initRoutes } from "./config/routes";
import { init as initWebServer } from "./webserver";
import { init as initWebSocketServer } from "./websocketserver";

const app = express();

initEnvironments(app);
initRoutes(app);

if (app.get("env") === "development") {
  app.use(errorHandler());
}

const webServer = initWebServer(app);
initWebSocketServer(app, webServer);
