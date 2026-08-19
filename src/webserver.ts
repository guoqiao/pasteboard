/**
 * Web Server Setup
 */
import http = require("http");
import express = require("express");

export function init(app: express.Application): http.Server {
  return http.createServer(app as any).listen(app.get("port"), () => {
    console.log(`Express server listening on port ${app.get("port")}`);
  });
}