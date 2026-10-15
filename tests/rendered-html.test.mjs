import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const projectRoot = new URL("../", import.meta.url);

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the complete Huh Cat landing page", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>Huh Cat — Interactive Playground<\/title>/i);
  assert.match(html, /powered by Robinhood/);
  assert.match(html, /Huh Moment for/);
  assert.match(html, /About Huh Cat/);
  assert.doesNotMatch(html, /is the token|Huh_World|0x[a-f0-9]{40}/i);
  assert.doesNotMatch(html, /<a(?:\s|>)/);
  assert.match(html, /Feed Huh Cat kibble 8/);
  assert.match(html, /figma-assets\/desktop-hero\.png/);
  assert.match(html, /figma-assets\/mobile-body\.png/);
  assert.equal((html.match(/mobile-kibble-mask/g) ?? []).length, 8);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape/);
});

test("uses local assets and keeps navigation disabled", async () => {
  const [page, layout, css, packageJson] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.doesNotMatch(page, /thehuhcat\.fun/);
  assert.doesNotMatch(css, /thehuhcat\.fun/);
  assert.match(page, /HUH-huh-huh\.mp3/);
  assert.match(page, /createBufferSource/);
  assert.match(page, /huh-cat-idle\.png/);
  assert.match(page, /pumpCycle === "idle" \?/);
  assert.match(page, /setEaten\(new Set\(\)\)/);
  assert.match(page, /setCatAnimationKey\(\(current\) => current \+ 1\)/);
  assert.match(page, /pump-pressed\.png/);
  assert.match(css, /@keyframes kibble-float/);
  assert.match(css, /\.kibble-hitbox\.is-eaten \.kibble-flight/);
  assert.match(css, /\.line-top \.figma-kline-wick/);
  assert.match(css, /\.pump-burst\.line-top \.animated-ceiling-break/);
  assert.doesNotMatch(page, /https:\/\/x\.com/);
  assert.match(page, /aria-label="X"/);
  assert.doesNotMatch(page, /header-icon-complete-[23]\.png/);
  assert.match(page, /mobile-header-x/);
  assert.match(page, /mobile-kibble-mask/);
  assert.doesNotMatch(css, /@keyframes chart-cat-sway/);
  assert.match(css, /\.meme-cat-effect:hover/);
  assert.match(css, /\.header-icon:hover/);
  assert.match(css, /\.mobile-header-x/);
  assert.match(css, /\.mobile-kibble-mask/);
  assert.doesNotMatch(css, /\.mobile-design\s*\{[^}]*max-width:\s*375px/s);
  assert.match(css, /\.pump-hitbox:active \.pump-button-pressed/);
  assert.match(css, /@keyframes pump-pressed-feedback/);
  assert.match(layout, /figma-assets\/favicon\.png/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);

  await Promise.all([
    access(new URL("../public/figma-assets/desktop-hero.png", import.meta.url)),
    access(new URL("../public/figma-assets/desktop-body.png", import.meta.url)),
    access(new URL("../public/figma-assets/mobile-hero.png", import.meta.url)),
    access(new URL("../public/figma-assets/mobile-body.png", import.meta.url)),
    access(new URL("../public/figma-assets/huh-cat.gif", import.meta.url)),
    access(new URL("../public/figma-assets/huh-cat-idle.png", import.meta.url)),
    access(new URL("../public/figma-assets/HUH.mp3", import.meta.url)),
    access(new URL("../public/figma-assets/HUH-huh-huh.mp3", import.meta.url)),
    access(new URL("../public/figma-assets/ceiling-break.png", import.meta.url)),
    access(new URL("../public/figma-assets/header-icon-complete-1.png", import.meta.url)),
    access(new URL("../public/figma-assets/pump-normal.png", import.meta.url)),
    access(new URL("../public/figma-assets/pump-pressed.png", import.meta.url)),
  ]);

  await assert.rejects(access(new URL("app/_sites-preview/", projectRoot)));
});
