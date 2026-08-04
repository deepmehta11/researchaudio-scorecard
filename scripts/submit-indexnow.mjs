import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const KEY = "b5f8e5d9ef605861f4432c4b66a2d884";
const ENDPOINT = "https://api.indexnow.org/indexnow";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const keyFile = `${KEY}.txt`;
const [sitemap, publishedKey] = await Promise.all([
  readFile(path.join(root, "sitemap.xml"), "utf8"),
  readFile(path.join(root, keyFile), "utf8"),
]);

assert.equal(publishedKey.trim(), KEY, "IndexNow key file must contain the configured key");

const urlList = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
assert.ok(urlList.length > 0, "sitemap must contain at least one URL");

const host = new URL(urlList[0]).host;
assert.ok(urlList.every((url) => new URL(url).host === host), "all submitted URLs must share one host");

const payload = {
  host,
  key: KEY,
  keyLocation: `https://${host}/${keyFile}`,
  urlList,
};

if (process.argv.includes("--check")) {
  console.log(`IndexNow payload verified: ${urlList.length} URLs for ${host}.`);
} else {
  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const details = (await response.text()).slice(0, 500);
    throw new Error(`IndexNow submission failed with ${response.status}: ${details}`);
  }

  console.log(`IndexNow accepted ${urlList.length} URLs for ${host} (${response.status}).`);
}
