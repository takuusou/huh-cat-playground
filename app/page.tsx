"use client";

/* eslint-disable @next/next/no-img-element -- Figma exports and the supplied animated GIF must render without transformation. */

import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties, MouseEvent } from "react";

const FIGMA_ROOT = "/figma-assets";
const KIBBLE_TOTAL = 8;

type LineLevel = "default" | "small" | "top";
type PumpCycle = "idle" | "small" | "burst";

type Box = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type Kibble = Box & {
  sprite: string;
};

const desktopKibbles: Kibble[] = [
  { x: 653, y: 396, width: 102, height: 102, sprite: "kibble-a.png" },
  { x: 1258.48, y: 366, width: 144.21, height: 144.21, sprite: "kibble-b.png" },
  { x: 558.57, y: 231, width: 138.62, height: 138.62, sprite: "kibble-c.png" },
  { x: 379.2, y: 361, width: 118.43, height: 118.43, sprite: "kibble-a.png" },
  { x: 1146.23, y: 206.8, width: 114.18, height: 114.18, sprite: "kibble-b.png" },
  { x: 1375, y: 268, width: 166.66, height: 166.66, sprite: "kibble-c.png" },
  { x: 1491, y: 405.29, width: 152.79, height: 152.79, sprite: "kibble-a.png" },
  { x: 719, y: 245, width: 94, height: 94, sprite: "kibble-b.png" },
];

const mobileKibbles: Kibble[] = [
  { x: 12.69, y: 180.09, width: 76.78, height: 76.78, sprite: "kibble-a.png" },
  { x: 303.93, y: 201, width: 80.11, height: 80.11, sprite: "kibble-b.png" },
  { x: 91.98, y: 84, width: 77, height: 77, sprite: "kibble-c.png" },
  { x: 24.98, y: 285.6, width: 72.53, height: 72.53, sprite: "kibble-a.png" },
  { x: 178.35, y: 159, width: 63.43, height: 63.43, sprite: "kibble-b.png" },
  { x: 266, y: 142.89, width: 92.58, height: 92.58, sprite: "kibble-c.png" },
  { x: 283, y: 332.94, width: 84.88, height: 84.88, sprite: "kibble-a.png" },
  { x: 89, y: 215, width: 63, height: 64, sprite: "kibble-b.png" },
];

const mobileKibbleMasks: Box[] = [
  { x: 82, y: 94, width: 50.5, height: 53.5 },
  { x: 287, y: 126.5, width: 55, height: 62 },
  { x: 174.5, y: 164, width: 47, height: 49 },
  { x: 29, y: 168.5, width: 44.5, height: 50 },
  { x: 294, y: 211, width: 53, height: 56 },
  { x: 90.5, y: 215.5, width: 53.5, height: 56.5 },
  { x: 17.5, y: 293.5, width: 49.5, height: 52.5 },
  { x: 297.5, y: 325, width: 56, height: 62.5 },
];

const desktopCat: Box = { x: 688, y: 268, width: 592, height: 592 };
const mobileCat: Box = { x: 43, y: 259, width: 308, height: 306 };
const desktopPump: Box = { x: 1014, y: 862, width: 146, height: 146 };
const mobilePump: Box = { x: 213, y: 586, width: 75, height: 76 };

const desktopMemeCats: Box[] = [
  { x: 166, y: 4040, width: 277, height: 318 },
  { x: 1510, y: 4000, width: 224, height: 530 },
  { x: 688, y: 4232, width: 461, height: 568 },
  { x: 78, y: 4641, width: 346, height: 291 },
  { x: 1454, y: 4500, width: 326, height: 452 },
];

const mobileMemeCats: Box[] = [
  { x: 27, y: 1490, width: 90, height: 190 },
  { x: 290, y: 1490, width: 70, height: 210 },
  { x: 120, y: 1580, width: 140, height: 180 },
  { x: 18, y: 1715, width: 110, height: 100 },
  { x: 268, y: 1705, width: 100, height: 125 },
];

function boxStyle(box: Box, artboardWidth: number, artboardHeight: number) {
  return {
    left: `${(box.x / artboardWidth) * 100}%`,
    top: `${(box.y / artboardHeight) * 100}%`,
    width: `${(box.width / artboardWidth) * 100}%`,
    height: `${(box.height / artboardHeight) * 100}%`,
  } satisfies CSSProperties;
}

function useSoundboard() {
  const contextRef = useRef<AudioContext | null>(null);
  const buffersRef = useRef(new Map<string, Promise<AudioBuffer>>());

  const getContext = useCallback(() => {
    if (contextRef.current) return contextRef.current;

    const AudioContextConstructor =
      window.AudioContext ??
      (window as typeof window & { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;

    if (!AudioContextConstructor) {
      throw new Error("Web Audio is not supported by this browser.");
    }

    contextRef.current = new AudioContextConstructor();
    return contextRef.current;
  }, []);

  const loadBuffer = useCallback(
    (file: string) => {
      const context = getContext();
      let bufferPromise = buffersRef.current.get(file);

      if (!bufferPromise) {
        bufferPromise = fetch(`${FIGMA_ROOT}/${file}`).then(async (response) => {
          if (!response.ok) throw new Error(`Unable to load sound: ${file}`);
          return context.decodeAudioData(await response.arrayBuffer());
        });
        buffersRef.current.set(file, bufferPromise);
      }

      return bufferPromise;
    },
    [getContext],
  );

  const prepare = useCallback(
    (file: string) => {
      const context = getContext();
      return Promise.all([context.resume(), loadBuffer(file)]).then(([, buffer]) => buffer);
    },
    [getContext, loadBuffer],
  );

  const warm = useCallback(() => {
    void Promise.all([loadBuffer("HUH.mp3"), loadBuffer("HUH-huh-huh.mp3")]).catch(
      (error) => console.warn("The Huh sounds could not be prepared.", error),
    );
  }, [loadBuffer]);

  const unlock = useCallback(() => {
    void Promise.all([prepare("HUH.mp3"), prepare("HUH-huh-huh.mp3")]).catch(
      (error) => console.warn("The Huh sounds could not be prepared.", error),
    );
  }, [prepare]);

  const play = useCallback(
    async (file: string, delayMs = 0) => {
      const context = getContext();
      const source = context.createBufferSource();
      const gain = context.createGain();

      source.buffer = await prepare(file);
      gain.gain.value = 0.75;
      source.connect(gain);
      gain.connect(context.destination);
      source.start(context.currentTime + delayMs / 1000);
    },
    [getContext, prepare],
  );

  return { play, unlock, warm };
}

type HeroProps = {
  variant: "desktop" | "mobile";
  eaten: Set<number>;
  catAnimationKey: number;
  lineLevel: LineLevel;
  pumpCycle: PumpCycle;
  onFeed: (event: MouseEvent<HTMLButtonElement>, index: number) => void;
  onPump: () => void;
  onUnlock: () => void;
};

function Hero({
  variant,
  eaten,
  catAnimationKey,
  lineLevel,
  pumpCycle,
  onFeed,
  onPump,
  onUnlock,
}: HeroProps) {
  const isDesktop = variant === "desktop";
  const width = isDesktop ? 1920 : 375;
  const height = isDesktop ? 1080 : 745;
  const kibbles = isDesktop ? desktopKibbles : mobileKibbles;
  const cat = isDesktop ? desktopCat : mobileCat;
  const pump = isDesktop ? desktopPump : mobilePump;
  const xIcon = (
    <span
      className={isDesktop ? "header-icon" : "mobile-header-x"}
      role="img"
      aria-label="X"
    >
      <img src={`${FIGMA_ROOT}/header-icon-complete-1.png`} alt="" />
    </span>
  );

  return (
    <section
      className={`figma-hero figma-hero-${variant} line-${lineLevel} pump-${pumpCycle}`}
      aria-label="Huh Cat pump game"
    >
      <img
        className="figma-layer figma-hero-art"
        src={`${FIGMA_ROOT}/${variant}-hero.png`}
        alt=""
        aria-hidden="true"
      />

      {isDesktop ? (
        <div className="header-icons">
          {xIcon}
        </div>
      ) : (
        xIcon
      )}

      {!isDesktop &&
        mobileKibbleMasks.map((mask, index) => (
          <span
            className="mobile-kibble-mask"
            style={boxStyle(mask, width, height)}
            key={`mobile-kibble-mask-${index}`}
            aria-hidden="true"
          />
        ))}

      {pumpCycle === "idle" ? (
        <img
          className="figma-layer hero-cat-idle"
          src={`${FIGMA_ROOT}/huh-cat-idle.png`}
          style={boxStyle(cat, width, height)}
          alt="Huh Cat with a green stick"
        />
      ) : (
        <img
          key={`${variant}-cat-${catAnimationKey}`}
          className="figma-layer hero-cat-gif"
          data-animation-key={catAnimationKey}
          src={`${FIGMA_ROOT}/huh-cat.gif`}
          style={boxStyle(cat, width, height)}
          alt="Huh Cat saying huh"
        />
      )}

      <div className="figma-kline" aria-hidden="true">
        <span className="figma-kline-wick" />
        <span className="figma-kline-body" />
      </div>

      <img
        className="figma-layer animated-ceiling-break"
        src={`${FIGMA_ROOT}/ceiling-break.png`}
        alt=""
        aria-hidden="true"
      />

      {kibbles.map((kibble, index) => (
        <button
          className={`kibble-hitbox ${eaten.has(index) ? "is-eaten" : ""}`}
          style={
            {
              ...boxStyle(kibble, width, height),
              "--float-delay": `${index * -310}ms`,
            } as CSSProperties
          }
          key={`${variant}-${index}`}
          type="button"
          disabled={eaten.has(index) || pumpCycle === "burst"}
          onClick={(event) => onFeed(event, index)}
          onPointerDown={onUnlock}
          aria-label={`Feed Huh Cat kibble ${index + 1}`}
        >
          <span className="kibble-floater">
            <img
              className="kibble-flight"
              src={`${FIGMA_ROOT}/${kibble.sprite}`}
              alt=""
            />
          </span>
        </button>
      ))}

      <button
        className={`pump-hitbox ${catAnimationKey > 0 ? "has-feedback" : ""}`}
        style={boxStyle(pump, width, height)}
        type="button"
        disabled={pumpCycle === "burst"}
        onClick={onPump}
        onPointerDown={onUnlock}
        aria-label={
          eaten.size === KIBBLE_TOTAL
            ? "Pump Huh Cat through the ceiling"
            : "Pump Huh Cat"
        }
      >
        <img
          key={`${variant}-pump-normal-${catAnimationKey}`}
          className="pump-button-art pump-button-normal"
          src={`${FIGMA_ROOT}/pump-normal.png`}
          alt=""
          aria-hidden="true"
        />
        <img
          key={`${variant}-pump-pressed-${catAnimationKey}`}
          className="pump-button-art pump-button-pressed"
          src={`${FIGMA_ROOT}/pump-pressed.png`}
          alt=""
          aria-hidden="true"
        />
      </button>

      <div className="sr-only">
        <h1>Huh Cat — Interactive Playground</h1>
      </div>
    </section>
  );
}

function Body({ variant }: { variant: "desktop" | "mobile" }) {
  const isDesktop = variant === "desktop";
  const width = isDesktop ? 1920 : 375;
  const height = isDesktop ? 5149 : 2046;
  const memeCats = isDesktop ? desktopMemeCats : mobileMemeCats;

  return (
    <section className={`body-stage body-stage-${variant}`}>
      <img
        className="figma-body-art"
        src={`${FIGMA_ROOT}/${variant}-body.png`}
        alt="Huh moments, project introduction and Huh Cat artwork"
      />

      <h2 className="about-heading">About Huh Cat</h2>
      <p className="about-copy">
        A hand-drawn interactive web design project. Feed the cat and press PUMP
        to explore animation and sound. This project has no real contract address
        (CA), provides no token, trading or wallet functionality, and is not
        affiliated with any market meme coin.
      </p>

      {memeCats.map((cat, index) => (
        <span
          className="body-overlay meme-cat-effect"
          style={boxStyle(cat, width, height)}
          aria-hidden="true"
          key={`meme-${variant}-${index}`}
        />
      ))}
    </section>
  );
}

export default function Home() {
  const [eaten, setEaten] = useState<Set<number>>(() => new Set());
  const [catAnimationKey, setCatAnimationKey] = useState(0);
  const [lineLevel, setLineLevel] = useState<LineLevel>("default");
  const [pumpCycle, setPumpCycle] = useState<PumpCycle>("idle");
  const timersRef = useRef<number[]>([]);
  const catAnimationReadyRef = useRef<Promise<void> | null>(null);
  const catAnimationPreloadRef = useRef<HTMLImageElement | null>(null);
  const pumpRequestRef = useRef(0);
  const { play, unlock, warm } = useSoundboard();

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((timer) => window.clearTimeout(timer));
    timersRef.current = [];
  }, []);

  const schedule = useCallback((callback: () => void, delay: number) => {
    timersRef.current.push(window.setTimeout(callback, delay));
  }, []);

  const preloadCatAnimation = useCallback(() => {
    if (!catAnimationReadyRef.current) {
      catAnimationReadyRef.current = new Promise<void>((resolve, reject) => {
        const image = new Image();
        catAnimationPreloadRef.current = image;

        image.onload = () => {
          if (typeof image.decode === "function") {
            void image.decode().then(resolve, resolve);
            return;
          }

          resolve();
        };
        image.onerror = () => reject(new Error("Unable to load the Huh Cat animation."));
        image.src = `${FIGMA_ROOT}/huh-cat.gif`;
      }).catch((error) => {
        catAnimationReadyRef.current = null;
        throw error;
      });
    }

    return catAnimationReadyRef.current;
  }, []);

  useEffect(
    () => () => {
      pumpRequestRef.current += 1;
      clearTimers();
    },
    [clearTimers],
  );
  useEffect(() => warm(), [warm]);
  useEffect(() => {
    void preloadCatAnimation().catch((error) =>
      console.warn("The Huh Cat animation could not be prepared.", error),
    );
  }, [preloadCatAnimation]);

  const feed = (event: MouseEvent<HTMLButtonElement>, index: number) => {
    if (eaten.has(index) || pumpCycle === "burst") return;

    const sourceRect = event.currentTarget
      .querySelector(".kibble-flight")
      ?.getBoundingClientRect();
    const hero = event.currentTarget.closest(".figma-hero");
    const catRect = hero?.querySelector(".hero-cat-idle")?.getBoundingClientRect();

    if (catRect && sourceRect) {
      event.currentTarget.style.setProperty(
        "--feed-x",
        `${catRect.left + catRect.width * 0.52 - (sourceRect.left + sourceRect.width / 2)}px`,
      );
      event.currentTarget.style.setProperty(
        "--feed-y",
        `${catRect.top + catRect.height * 0.43 - (sourceRect.top + sourceRect.height / 2)}px`,
      );
    }

    setEaten((current) => new Set(current).add(index));
  };

  const pump = () => {
    if (pumpCycle === "burst") return;
    const request = ++pumpRequestRef.current;
    clearTimers();

    void preloadCatAnimation()
      .then(() => {
        if (request !== pumpRequestRef.current) return;

        setCatAnimationKey((current) => current + 1);

        if (eaten.size === KIBBLE_TOTAL) {
          void play("HUH-huh-huh.mp3", 445).catch((error) =>
            console.warn("The charged Huh sound could not be played.", error),
          );
          setPumpCycle("burst");
          setLineLevel("top");
          schedule(() => setLineLevel("default"), 1900);
          schedule(() => {
            setEaten(new Set());
            setPumpCycle("idle");
          }, 4600);
          return;
        }

        void play("HUH.mp3", 380).catch((error) =>
          console.warn("The Huh sound could not be played.", error),
        );
        setPumpCycle("small");
        setLineLevel("small");
        schedule(() => setLineLevel("default"), 280);
        schedule(() => setPumpCycle("idle"), 1200);
      })
      .catch((error) =>
        console.warn("The Huh Cat animation could not be played.", error),
      );
  };

  const heroProps = {
    eaten,
    catAnimationKey,
    lineLevel,
    pumpCycle,
    onFeed: feed,
    onPump: pump,
    onUnlock: unlock,
  };

  return (
    <main className="figma-site">
      <div className="desktop-design">
        <Hero variant="desktop" {...heroProps} />
        <Body variant="desktop" />
      </div>

      <div className="mobile-design">
        <Hero variant="mobile" {...heroProps} />
        <Body variant="mobile" />
      </div>

      <div className="sr-only">
        <h2>powered by Robinhood</h2>
        <h2>Huh Moment for pepe</h2>
        <h2>Huh Moment for WIF</h2>
        <h2>Huh Moment for Bonk</h2>
      </div>
    </main>
  );
}
