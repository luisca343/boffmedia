"use client";

import * as React from "react";
import { DkApp, DkBody } from "@boffmedia/ui/datakit";

import { BsimNavProvider, type BsimNav } from "../nav";
import { TeamsView } from "./TeamsView";

/**
 * Standalone host for the existing teambuilder.
 *
 * The editor is intentionally the same implementation used by battlesim, but
 * it no longer needs battlesim's room shell or tab bar around it. Hosts can
 * provide a real URL-backed nav; the launcher can omit it and use the memory
 * backing supplied by BsimNavProvider.
 */
export function TeamBuilderApp({ nav }: { nav?: BsimNav }) {
  return (
    <BsimNavProvider nav={nav} initialScreen="teams">
      <DkApp>
        <DkBody>
          <TeamsView />
        </DkBody>
      </DkApp>
    </BsimNavProvider>
  );
}
