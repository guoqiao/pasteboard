/**
 * Express Bootstrap
 */
import express = require("express");
import { init as initEnvironments } from "./config/environments";
import { init as initRoutes } from "./config/routes";
import { init as initWebServer } from "./webserver";
import { init as initWebSocketServer } from "./websocketserver";

const app = express();

initEnvironments(app, express);
initRoutes(app);

const webServer = initWebServer(app);
initWebSocketServer(app, webServer);