/**
 * Google Analytics API Wrapper
 * Based on https://gist.github.com/PaquitoSoft/4451865
 */
import * as fs from "fs";
import * as crypto from "crypto";
import _ = require("underscore");
import request = require("request");
import auth = require("../auth");

const SIGNATURE_ENCODE_METHOD = "base64";

const API_URL = "https://www.googleapis.com/analytics/v3/data/ga";

const authHeader = {
  alg: "RS256",
  typ: "JWT",
};

const authClaimSet: any = {
  iss: auth.google_analytics ? auth.google_analytics.SERVICE_ACCOUNT_EMAIL : undefined,
  scope: "https://www.googleapis.com/auth/analytics.readonly",
  aud: "https://accounts.google.com/o/oauth2/token",
};

let key: string | null = null;
let token: any = {};

const urlEscape = (source: string) =>
  source.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

const base64Encode = (obj: any) => urlEscape(Buffer.from(JSON.stringify(obj), "utf8").toString("base64"));

const readPrivateKey = (): string => {
  key = key || fs.readFileSync(auth.google_analytics.KEY_PATH, "utf8");
  return key;
};

const authorize = (callback: (err?: Error | null, token?: string) => void): void => {
  if (!auth.google_analytics) {
    return _.defer(callback, new Error("Missing Google Analytics Credentials"));
  }

  const now = parseInt(Date.now() / 1000 + "", 10);

  if (token && token.expires > now) {
    return _.defer(callback, null, token.value);
  }

  const signatureKey = readPrivateKey();

  authClaimSet.iat = now;
  authClaimSet.exp = now + 60;

  const signatureInput = base64Encode(authHeader) + "." + base64Encode(authClaimSet);

  const cipher = crypto.createSign("RSA-SHA256");
  cipher.update(signatureInput);
  const signature = cipher.sign(signatureKey, SIGNATURE_ENCODE_METHOD);
  const jwt = signatureInput + "." + urlEscape(signature);

  request(
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      uri: "https://accounts.google.com/o/oauth2/token",
      body:
        "grant_type=" +
        encodeURIComponent("urn:ietf:params:oauth:grant-type:jwt-bearer") +
        "&assertion=" +
        jwt,
    },
    (error, response, body) => {
      if (error) {
        callback(new Error(error));
      } else {
        const result = JSON.parse(body);
        if (result.error) {
          callback(new Error(result.error));
        } else {
          token = {
            value: result.access_token,
            expires: now + result.expires_in,
          };
          callback(null, token.value);
        }
      }
    }
  );
};

// Fetch the total number of unique page views for the given path
export function getTotalViews(path: string, callback: (err?: Error | null, views?: number) => void): void {
  authorize((err, token) => {
    if (err) return console.log(err);

    request(
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        qs: {
          ids: auth.google_analytics.PROFILE_ID,
          "start-date": "2005-01-01",
          "end-date": "9999-12-31",
          dimensions: "ga:pagePath",
          metrics: "ga:uniquePageviews",
          filters: `ga:pagePath==${path}`,
        },
        uri: API_URL,
      },
      (err, res, body) => {
        if (err) return callback(err);
        const data = JSON.parse(body);
        if (data.error) return callback(data.error);

        callback(null, data.rows && data.rows[0] ? data.rows[0][1] : undefined);
      }
    );
  });
}