/**
 * A collection of common helper methods
 */
import express = require("express");
import auth = require("../auth");

const BASE62_CHARS = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
let lastTimestamp = 0;

// Generates a unique file name with the given file type.
// This current method generates names that are guaranteed
// to be unique for 115 days (10^13 microseconds).
export function generateFileName(type: string): string {
  const fileExt = "." + (type === "jpeg" ? "jpg" : type.replace("image/", ""));
  let timestamp = Date.now() * 1000 + Math.floor(process.hrtime()[1] / 1000);
  timestamp = Math.max(timestamp, lastTimestamp + 1);
  lastTimestamp = timestamp;
  let timeString = "" + timestamp;
  timeString = timeString.substr(timeString.length - 13); // 13 last digits
  return `${base62Encode(parseInt(timeString, 10))}${fileExt}`;
}

// Creates a cookie to identify the user as the image owner.
export function setImageOwner(res: express.Response, image: string): void {
  const hour = 1000 * 60 * 60;
  const key = imageOwnerKey(image);
  if (key) {
    res.cookie(`pb_${image}`, key, {
      maxAge: hour * 24 * 7, // 1 week
    });
  }
}

// Removes the owner from the image,
// usually after the image has been deleted.
export function removeImageOwner(res: express.Response, image: string): void {
  res.clearCookie(`pb_${image}`);
}

// Checks if the user sending the request
// is the owner of the requested image.
export function isImageOwner(req: express.Request, image: string): boolean {
  const key = req.cookies[`pb_${image}`];
  if (key) {
    return key === imageOwnerKey(image);
  }
  return false;
}

export function imageURL(req: express.Request, image: string): string {
  if (auth.amazon) {
    const base = auth.amazon.CDN_URL || `http://${auth.amazon.S3_BUCKET}.s3.amazonaws.com`;
    return `${base}${req.app.get("amazonFilePath")}${image}`;
  } else {
    return `http://${req.headers.host}${req.app.get("localStorageURL")}${image}`;
  }
}

// Generate the image owner key
function imageOwnerKey(image: string): string | false {
  if (!auth.hashing) return false;
  return auth.hashing.keyHash(image);
}

// Converts an integer from base 10 to 62
function base62Encode(n: number): string {
  const arr: string[] = [];
  if (n === 0) return BASE62_CHARS[0];
  while (n) {
    const r = n % 62;
    n = (n - r) / 62;
    arr.push(BASE62_CHARS[r]);
  }
  return arr.reverse().join("");
}