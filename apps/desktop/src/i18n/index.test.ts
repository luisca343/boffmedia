import { describe, it, expect, beforeEach } from "vitest";
import { setLocale, translate } from "./index";

/**
 * ICU plurals through the REAL desktop translator.
 *
 * The first version of this file re-implemented the parser inside the test and
 * asserted against its own copy, so deleting the implementation in index.tsx
 * would not have failed it — no guard at all. Everything here goes through the
 * exported `translate`, which is what the screens call.
 *
 * T2 exists because tool package catalogues use ICU plurals and the desktop
 * host merges flat keys: if it could not parse them, labels would render as raw
 * `{count, plural, ...}` markup.
 */
describe("desktop i18n · ICU plurals", () => {
  beforeEach(() => {
    setLocale("es");
  });

  it("selects the singular branch in Spanish", () => {
    expect(translate("tools", "toolCount", { count: 1 })).toBe("1 herramienta");
  });

  it("selects the plural branch in Spanish", () => {
    expect(translate("tools", "toolCount", { count: 5 })).toBe("5 herramientas");
  });

  it("selects the right branch in English too", () => {
    setLocale("en");
    expect(translate("tools", "toolCount", { count: 1 })).toBe("1 tool");
    expect(translate("tools", "toolCount", { count: 7 })).toBe("7 tools");
  });

  it("never leaks raw ICU markup to the UI", () => {
    for (const locale of ["es", "en"]) {
      setLocale(locale);
      for (const count of [0, 1, 2, 21, 100]) {
        const out = translate("tools", "toolCount", { count });
        // The failure this finding predicts: the label shows the source syntax.
        expect(out).not.toContain("plural");
        expect(out).not.toContain("{");
        expect(out).not.toContain("}");
        expect(out).toContain(String(count));
      }
    }
  });
});
