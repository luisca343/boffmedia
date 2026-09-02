"use client";

/**
 * What both manifests mount.
 *
 * Mewgenics is two registry entries — the codex and the cat builder — but ONE
 * mounted component tree, and that is what makes the link between them work in
 * a host with no router. The launcher renders a manifest's `component` straight
 * out of the registry with no props and nowhere to wrap anything, so "open the
 * builder" cannot be a route change there; it is a screen swap inside this
 * tree, driven by the same `MewNav` that carries the address (see `./nav`).
 *
 * apps/web keeps its two real routes: it supplies a nav of its own, this
 * component's provider passes it through untouched, and `screen` follows the
 * route that is mounted rather than local state.
 */

import * as React from "react";
import { MewNavProvider, useMewNav, type MewScreen } from "./nav";
import { MewCodex } from "./codex";
import { MewCatBuilder } from "./builder/MewCatBuilder";

function MewScreenSwitch() {
  const { screen } = useMewNav();
  return screen === "builder" ? <MewCatBuilder /> : <MewCodex />;
}

/**
 * @param initialScreen which screen a registry host lands on. Ignored when a
 *        host supplied its own nav, because then the route is the answer.
 */
export function MewRoot({ initialScreen = "codex" }: { initialScreen?: MewScreen }) {
  return (
    <MewNavProvider initialScreen={initialScreen}>
      <MewScreenSwitch />
    </MewNavProvider>
  );
}

/** The two registry entry points. Separate components because a manifest's
 *  `component` takes no props, so the landing screen has to be baked in. */
export function MewCodexTool() {
  return <MewRoot initialScreen="codex" />;
}

export function MewBuilderTool() {
  return <MewRoot initialScreen="builder" />;
}
