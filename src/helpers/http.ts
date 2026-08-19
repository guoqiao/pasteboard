/**
 * Minimal HTTP helpers that replace the deprecated `request` package.
 */
import * as http from "http";
import * as https from "https";
import * as querystring from "querystring";
import express = require("express");

// Stream a remote resource into an Express response without buffering it.
export function pipeRemote(
  url: string,
  res: express.Response,
  headers: { [key: string]: string | undefined } = {}
): void {
  const client = url.startsWith("https:") ? https : http;
  client
    .get(url, { headers }, (upstream) => {
      res.statusCode = upstream.statusCode || 502;
      for (const key of Object.keys(upstream.headers)) {
        const value = upstream.headers[key];
        if (value !== undefined) res.setHeader(key, value);
      }
      upstream.pipe(res as any);
    })
    .on("error", () => {
      if (!res.headersSent) res.status(502).send("Failed to fetch");
    });
}

export interface JsonRequestOptions {
  method?: string;
  headers?: { [key: string]: string };
  body?: string | object;
  qs?: { [key: string]: string | number };
}

// Fetch a URL and parse the response as JSON. Resolves with the parsed body
// (or null for an empty response) and rejects only on network errors, matching
// the behaviour of the deprecated `request` callback.
export async function jsonFetch(
  url: string,
  options: JsonRequestOptions = {}
): Promise<any> {
  const { method = "GET", headers = {}, body, qs } = options;
  const target = qs ? `${url}?${querystring.stringify(qs)}` : url;
  const isJson = body !== undefined && typeof body === "object";

  const response = await fetch(target, {
    method,
    headers: {
      ...(isJson ? { "Content-Type": "application/json" } : {}),
      ...headers,
    },
    body:
      body === undefined
        ? undefined
        : isJson
        ? JSON.stringify(body)
        : body,
  });

  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
