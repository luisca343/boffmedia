"use client";
import * as React from "react";
import { useTranslations } from "next-intl";
import { Ico } from "./icons";

/** What the API accepts. Mirrors ACCOUNT_IMAGE_UPLOAD's filter and 5 MB cap. */
const ACCEPTED = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024;

/**
 * Picks an account picture and previews it.
 *
 * Both limits are checked here as well as on the server: a 6 MB file otherwise uploads in full
 * before multer rejects it, which on a Minecraft client's connection is a long wait to be told no.
 */
export function ImagePicker({
  value,
  onChange,
  currentUrl,
}: {
  value: File | null;
  onChange: (file: File | null) => void;
  /** The picture the account already has, shown until a new one is chosen. */
  currentUrl?: string;
}) {
  const t = useTranslations("starbank");
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [error, setError] = React.useState("");
  const [preview, setPreview] = React.useState<string | null>(null);

  // Object URLs are leaked memory until revoked, and a picker can be used repeatedly.
  React.useEffect(() => {
    if (!value) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(value);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [value]);

  function pick(file: File | null) {
    if (!file) {
      onChange(null);
      setError("");
      return;
    }
    if (!ACCEPTED.includes(file.type)) {
      setError(t("cuentas.dialog.imageFormat"));
      return;
    }
    if (file.size > MAX_BYTES) {
      setError(t("cuentas.dialog.imageTooBig"));
      return;
    }
    setError("");
    onChange(file);
  }

  const shown = preview ?? currentUrl;

  return (
    <div>
      <div className="flex items-center gap-3">
        <span className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-sb-md border border-sb-border bg-sb-surface-3 text-sb-fg-muted">
          {shown ? (
            <img
              src={shown}
              alt=""
              className="block h-full w-full object-cover [image-rendering:pixelated]"
            />
          ) : (
            <Ico name="imagePlus" size={20} />
          )}
        </span>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-sb-md border border-sb-border bg-sb-surface px-2.5 py-1.5 text-[12.5px] font-semibold transition-colors hover:border-sb-300 hover:bg-sb-50"
          >
            <Ico name="imagePlus" size={14} />
            {value || currentUrl ? t("cuentas.dialog.imageChange") : t("cuentas.dialog.imageChoose")}
          </button>
          {value && (
            <button
              type="button"
              onClick={() => pick(null)}
              className="inline-flex items-center gap-1.5 rounded-sb-md border border-sb-border bg-sb-surface px-2.5 py-1.5 text-[12.5px] font-semibold text-sb-fg-muted transition-colors hover:border-sb-neg hover:text-sb-neg"
            >
              <Ico name="trash" size={14} />
              {t("cuentas.dialog.imageRemove")}
            </button>
          )}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(",")}
        className="hidden"
        onChange={(e) => {
          pick(e.target.files?.[0] ?? null);
          // Reset, so re-choosing the same file after removing it still fires a change.
          e.target.value = "";
        }}
      />

      <div className="mt-1.5 text-[11.5px] text-sb-fg-muted">{t("cuentas.dialog.imageHint")}</div>
      {error && <div className="mt-1 text-[12.5px] font-medium text-sb-neg">{error}</div>}
    </div>
  );
}
