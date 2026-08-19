/**
 * WebSocket Server Setup
 *
 * Sockets are used to detect when users leave the web
 * page so that temporary data can be removed
 */
import * as fs from "fs";
import http = require("http");
import express = require("express");
import websocket = require("websocket");

let app: express.Application | null = null;
const clients: {
  [id: string]: {
    connection: websocket.IConnection;
    file: any;
    uploading: { [path: string]: boolean };
  };
} = {};

export function init(expressApp: express.Application, webServer: http.Server): void {
  app = expressApp;
  app.set("clients", clients);

  const webSocketServer = new websocket.server({
    httpServer: webServer,
    autoAcceptConnections: false,
  });

  webSocketServer.on("request", (req) => {
    const ID = generateID();
    if (originIsAllowed(req.origin, req)) {
      const connection = req.accept(null, req.origin);

      // Send the ID to the client
      connection.sendUTF(JSON.stringify({ id: ID }));
      clients[ID] = {
        connection,
        file: false,
        uploading: {},
      };

      connection.on("close", (reasonCode, description) => {
        const client = clients[ID];
        if (client && client.file) {
          // Delete the leftover file
          fs.unlink(client.file.filepath, () => undefined);
        }
        delete clients[ID];
      });
    } else {
      console.log(`Socket connection denied from ${req.origin}`);
    }
  });
}

// Generate a unique ID for clients connecting to the server
// http://stackoverflow.com/a/2117523
function generateID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function originIsAllowed(origin: string, req: websocket.IRequest): boolean {
  if (!app) return false;
  if (app.get("localrun")) return true;
  if (origin === app.get("domain")) return true;

  const headers = req.httpRequest.headers;
  const forwardedProto = headers["x-forwarded-proto"];
  let protocol =
    typeof forwardedProto === "string"
      ? forwardedProto
      : Array.isArray(forwardedProto)
      ? forwardedProto[0]
      : undefined;
  protocol = protocol || ((req.httpRequest.socket as any).encrypted ? "https" : "http");
  protocol = protocol.split(",")[0].trim();
  return origin === `${protocol}://${headers.host}`;
}