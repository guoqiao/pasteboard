/**
 * Application routing setup
 */
import express = require("express");
import controllers = require("../controllers");

let app: express.Application;

export function init(expressApp: express.Application): void {
  app = expressApp;
  const loaded = controllers.init(app);

  // Go through all controllers and set up their routes.
  // Routes are prefixed with the controller name unless
  // it starts with '/'. The main controller is not prefixed.
  for (const name of Object.keys(loaded)) {
    setupRoutes(name, loaded[name].routes);
  }

  // Set the image route last, to give other root routes priority
  app.get("/:image", loaded.images.index);
}

// Create the routes from the routes object in the controller
function setupRoutes(controller: string, routes: any): void {
  if (!routes) return;
  for (const verb of Object.keys(routes)) {
    const verbRoutes = routes[verb];
    for (const route of Object.keys(verbRoutes)) {
      (app as any)[verb](createURL(controller, route), verbRoutes[route]);
    }
  }
}

function createURL(controller: string, route: string): string {
  // Main controller
  if (controller === "main") return `/${route}`;
  // Routes starting with '/'
  if (route[0] === "/") return route;
  // Regular route
  return `/${controller}/${route}`;
}