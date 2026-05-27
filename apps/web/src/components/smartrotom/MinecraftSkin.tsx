"use client"

import { useEffect, useState } from "react";
import { SkinViewer } from "skinview3d";
import { MisionesService } from "@/services/api/smartrotom/misionesService";
import type { ApiResponse } from "@/services/boffAPI";
import { env } from "@/config/env.public";

// Source skin PNGs live in the web app's own public/ folder → same-origin relative URL.
const SKIN_BASE = "/smartrotom/img/customNPC";
// Renders are written by the API and served via NestJS ServeStaticModule (serveRoot: '/public').
// In production the two containers don't share a filesystem, so we must use the API origin.
const RENDER_BASE = `${env.NEXT_PUBLIC_API}/public/smartrotom/img/customNPC/renders`;
const FALLBACK = "steve";
const LOG = "[MinecraftSkin]";

// skin field from the catalog already contains the .png extension — strip it for API keys.
function baseName(npcName: string) {
  return npcName.replace(/\.png$/i, "");
}

// The API wraps all responses as ApiResponse<T> where data = { exists: boolean }.
// !!response.data is always true (it's an object), so we must read the nested field.
function extractExists(response: ApiResponse<any>): boolean {
  return (response?.data as any)?.exists === true;
}

// ─── Shared render utilities ─────────────────────────────────────────────────

export async function generateNpcBodyRender(npcName: string, force = false): Promise<string | null> {
  const base = baseName(npcName);
  console.log(`${LOG} generateNpcBodyRender — npcName="${npcName}" base="${base}" force=${force} RENDER_BASE=${RENDER_BASE}`);

  if (!force) {
    try {
      const resp = await MisionesService.getCustomNpcRender(base);
      const cached = extractExists(resp);
      console.log(`${LOG} body render cache check for "${base}": exists=${cached}`);
      if (cached) {
        console.log(`${LOG} body render cache HIT — returning existing render`);
        return `${RENDER_BASE}/${base}.png?t=${Date.now()}`;
      }
    } catch (err) {
      console.warn(`${LOG} body render cache check failed for "${base}":`, err);
    }
  }

  console.log(`${LOG} body render cache MISS — generating with skinview3d`);

  return new Promise((resolve) => {
    const viewer = new SkinViewer({ width: 200, height: 400, enableControls: false });
    viewer.camera.rotation.x = -0.620;
    viewer.camera.rotation.y =  0.534;
    viewer.camera.rotation.z =  0.348;
    viewer.camera.position.x = -30.5;
    viewer.camera.position.y =  22.0;
    viewer.camera.position.z =  42.0;

    const skinUrl = `${SKIN_BASE}/${base}.png`;
    console.log(`${LOG} loading skin from: ${skinUrl}`);

    viewer.loadSkin(skinUrl)
      .then(() => {
        console.log(`${LOG} skin loaded successfully, rendering`);
        viewer.render();
        const image = viewer.canvas.toDataURL();
        viewer.dispose();
        MisionesService.uploadCustomNpcImage({ npcName: base, image })
          .then(() => {
            console.log(`${LOG} body render uploaded for "${base}"`);
            resolve(`${RENDER_BASE}/${base}.png?t=${Date.now()}`);
          })
          .catch((err) => {
            console.error(`${LOG} body render upload failed for "${base}":`, err);
            resolve(null);
          });
      })
      .catch(() => {
        console.warn(`${LOG} skin load failed for "${skinUrl}", retrying with fallback`);
        viewer.loadSkin(`${SKIN_BASE}/${FALLBACK}.png`)
          .then(() => {
            viewer.render();
            const image = viewer.canvas.toDataURL();
            viewer.dispose();
            MisionesService.uploadCustomNpcImage({ npcName: base, image })
              .then(() => {
                console.log(`${LOG} body render (fallback) uploaded for "${base}"`);
                resolve(`${RENDER_BASE}/${base}.png?t=${Date.now()}`);
              })
              .catch((err) => {
                console.error(`${LOG} fallback body render upload failed:`, err);
                resolve(null);
              });
          })
          .catch(() => {
            viewer.dispose();
            console.error(`${LOG} fallback skin load also failed for "${base}"`);
            resolve(null);
          });
      });
  });
}

export async function generateNpcFaceRender(npcName: string, force = false): Promise<string | null> {
  const base = baseName(npcName);
  const faceKey = `${base}_face`;
  console.log(`${LOG} generateNpcFaceRender — npcName="${npcName}" base="${base}" faceKey="${faceKey}" force=${force} RENDER_BASE=${RENDER_BASE}`);

  if (!force) {
    try {
      const resp = await MisionesService.getCustomNpcRender(faceKey);
      const cached = extractExists(resp);
      console.log(`${LOG} face render cache check for "${faceKey}": exists=${cached}`);
      if (cached) {
        console.log(`${LOG} face render cache HIT — returning existing render`);
        return `${RENDER_BASE}/${faceKey}.png?t=${Date.now()}`;
      }
    } catch (err) {
      console.warn(`${LOG} face render cache check failed for "${faceKey}":`, err);
    }
  }

  console.log(`${LOG} face render cache MISS — generating with canvas crop`);

  return new Promise((resolve) => {
    const img = new window.Image();
    let triedFallback = false;

    const attemptLoad = (url: string) => {
      console.log(`${LOG} loading source skin from: ${url}`);
      img.src = url;
    };

    img.onload = () => {
      console.log(`${LOG} source skin loaded (${img.src}), cropping face + hat`);
      const canvas = document.createElement("canvas");
      canvas.width = 128;
      canvas.height = 128;
      const ctx = canvas.getContext("2d")!;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img, 8, 8, 8, 8, 0, 0, 128, 128);   // face layer
      ctx.drawImage(img, 40, 8, 8, 8, 0, 0, 128, 128);  // hat layer
      const image = canvas.toDataURL("image/png");
      MisionesService.uploadCustomNpcImage({ npcName: faceKey, image })
        .then(() => {
          console.log(`${LOG} face render uploaded for "${faceKey}"`);
          resolve(`${RENDER_BASE}/${faceKey}.png?t=${Date.now()}`);
        })
        .catch((err) => {
          console.error(`${LOG} face render upload failed for "${faceKey}":`, err);
          resolve(null);
        });
    };

    img.onerror = () => {
      if (!triedFallback) {
        triedFallback = true;
        console.warn(`${LOG} source skin failed (${img.src}), retrying with fallback`);
        attemptLoad(`${SKIN_BASE}/${FALLBACK}.png`);
      } else {
        console.error(`${LOG} fallback skin also failed — giving up for "${faceKey}"`);
        resolve(null);
      }
    };

    attemptLoad(`${SKIN_BASE}/${base}.png`);
  });
}

export async function generateNpcHeadRender(npcName: string, force = false): Promise<string | null> {
  const base = baseName(npcName);
  const headKey = `${base}_head`;
  console.log(`${LOG} generateNpcHeadRender — npcName="${npcName}" base="${base}" headKey="${headKey}" force=${force}`);

  if (!force) {
    try {
      const resp = await MisionesService.getCustomNpcRender(headKey);
      const cached = extractExists(resp);
      console.log(`${LOG} head render cache check for "${headKey}": exists=${cached}`);
      if (cached) {
        console.log(`${LOG} head render cache HIT — returning existing render`);
        return `${RENDER_BASE}/${headKey}.png?t=${Date.now()}`;
      }
    } catch (err) {
      console.warn(`${LOG} head render cache check failed for "${headKey}":`, err);
    }
  }

  console.log(`${LOG} head render cache MISS — generating with skinview3d`);

  return new Promise((resolve) => {
  const viewer = new SkinViewer({ width: 128, height: 128, enableControls: false });
  const { skin } = viewer.playerObject;
  skin.body.visible = false;
  skin.leftArm.visible = false;
  skin.rightArm.visible = false;
  skin.leftLeg.visible = false;
  skin.rightLeg.visible = false;
  viewer.playerObject.cape.visible = false;
  viewer.playerObject.position.set(-9, -2.5, 11.5);
  viewer.camera.rotation.x = -0.65;
  viewer.camera.rotation.y = 0.02;
  viewer.camera.rotation.z = -0.1;
  viewer.camera.position.x = -17.5;
  viewer.camera.position.y = 15.5;
  viewer.camera.position.z = 23.5;

    const skinUrl = `${SKIN_BASE}/${base}.png`;
    console.log(`${LOG} loading skin for head render from: ${skinUrl}`);

    viewer.loadSkin(skinUrl)
      .then(() => {
        viewer.render();
        const image = viewer.canvas.toDataURL();
        viewer.dispose();
        MisionesService.uploadCustomNpcImage({ npcName: headKey, image })
          .then(() => {
            console.log(`${LOG} head render uploaded for "${headKey}"`);
            resolve(`${RENDER_BASE}/${headKey}.png?t=${Date.now()}`);
          })
          .catch((err) => {
            console.error(`${LOG} head render upload failed for "${headKey}":`, err);
            resolve(null);
          });
      })
      .catch(() => {
        console.warn(`${LOG} skin load failed for head render, retrying with fallback`);
        viewer.loadSkin(`${SKIN_BASE}/${FALLBACK}.png`)
          .then(() => {
            viewer.render();
            const image = viewer.canvas.toDataURL();
            viewer.dispose();
            MisionesService.uploadCustomNpcImage({ npcName: headKey, image })
              .then(() => {
                console.log(`${LOG} head render (fallback) uploaded for "${headKey}"`);
                resolve(`${RENDER_BASE}/${headKey}.png?t=${Date.now()}`);
              })
              .catch((err) => {
                console.error(`${LOG} fallback head render upload failed:`, err);
                resolve(null);
              });
          })
          .catch(() => {
            viewer.dispose();
            console.error(`${LOG} fallback skin load also failed for head render "${headKey}"`);
            resolve(null);
          });
      });
  });
}

export async function checkNpcRenderStatus(npcName: string) {
  const base = baseName(npcName);
  // Source check uses a HEAD request to the actual static URL (not the API,
  // which checks customNPC/images/ — a different directory from where skins live).
  const [source, face, body, head] = await Promise.all([
    fetch(`${SKIN_BASE}/${base}.png`, { method: "HEAD" })
      .then(r => r.ok)
      .catch(() => false),
    MisionesService.getCustomNpcRender(`${base}_face`)
      .then(r => extractExists(r))
      .catch(() => false),
    MisionesService.getCustomNpcRender(base)
      .then(r => extractExists(r))
      .catch(() => false),
    MisionesService.getCustomNpcRender(`${base}_head`)
      .then(r => extractExists(r))
      .catch(() => false),
  ]);
  console.log(`${LOG} checkNpcRenderStatus for "${base}":`, { source, face, body, head });
  return { sourceExists: source, faceRenderExists: face, bodyRenderExists: body, headRenderExists: head };
}

// ─── NpcFace: 2D face + hat layer, cached as ${base}_face.png ────────────────

export function NpcFace({
  npcName,
  width = 32,
  height = 32,
  style,
}: {
  npcName: string;
  width?: number;
  height?: number;
  style?: React.CSSProperties;
}) {
  const [src, setSrc] = useState<string | undefined>(undefined);

  useEffect(() => {
    generateNpcFaceRender(npcName).then(url => setSrc(url ?? undefined));
  }, [npcName]);

  if (!src) {
    return <div style={{ width, height, flexShrink: 0, ...style }} />;
  }

  return (
    <img
      width={width}
      height={height}
      src={src}
      alt={npcName}
      style={{ imageRendering: "pixelated", display: "block", flexShrink: 0, ...style }}
    />
  );
}

// ─── NpcHead: 3D head-only render, cached as ${base}_head.png ────────────────

const headCache = new Map<string, string>();

export function NpcHead({
  npcName,
  width = 32,
  height = 32,
  style,
}: {
  npcName: string;
  width?: number;
  height?: number;
  style?: React.CSSProperties;
}) {
  const base = baseName(npcName);
  const [src, setSrc] = useState<string | undefined>(headCache.get(base) ?? undefined);

  useEffect(() => {
    if (headCache.has(base)) return;
    generateNpcHeadRender(npcName).then(url => {
      if (url) {
        headCache.set(base, url);
        setSrc(url);
      }
    });
  }, [npcName, base]);

  if (!src) {
    return <div style={{ width, height, flexShrink: 0, ...style }} />;
  }

  return (
    <img
      width={width}
      height={height}
      src={src}
      alt={npcName}
      style={{ imageRendering: "pixelated", display: "block", flexShrink: 0, ...style }}
    />
  );
}

// ─── NpcSkin: 3D body render, cached as ${base}.png ──────────────────────────

const skinCache = new Map<string, string>();

export function invalidateNpcRenderCache(npcName: string) {
  skinCache.delete(baseName(npcName));
  headCache.delete(baseName(npcName));
}

export default function NpcSkin({
  npcName,
  width = 150,
  height = 150,
  style,
}: {
  npcName: string;
  width?: number;
  height?: number;
  style?: React.CSSProperties;
}) {
  const base = baseName(npcName);
  const [skin, setSkin] = useState<string | null>(skinCache.get(base) ?? null);

  useEffect(() => {
    if (skinCache.has(base)) return;
    generateNpcBodyRender(base).then(url => {
      if (url) {
        skinCache.set(base, url);
        setSkin(url);
      }
    });
  }, [base]);

  return (
    <img
      width={width}
      height={height}
      src={skin ?? `${RENDER_BASE}/${FALLBACK}.png`}
      alt={npcName}
      style={{ display: "block", flexShrink: 0, ...style }}
    />
  );
}
