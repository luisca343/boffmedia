/**
 * Headless File System picker for Minecraft instances and Hytale installs.
 *
 * Owns the File System Access API detection, the hidden input element, the
 * webkitdirectory/directory attribute effect, and the pick flow (FS API or
 * fallback to input element). Callback-driven, no store imports — each tool's
 * picker UI remains independent.
 *
 * Detection and the attribute effect live here once so schematic-compat and
 * schematic-viewer share one behaviour rather than each keeping a copy.
 */

import { useEffect, useRef, useState } from "react";
import {
  collectFromDirectory,
  collectFromFileList,
  getDirectoryPicker,
} from "../registry/instance-files";
import { gameMeta, type GameId } from "../adapters/game-adapter";

interface UseInstanceFilePickerOptions {
  game: GameId;
  onPick: (files: File[]) => void;
}

export interface UseInstanceFilePickerReturn {
  hasFsApi: boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
  inputProps: {
    multiple?: boolean;
    accept?: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  };
  pick: () => Promise<void>;
}

/**
 * Use the File System Access API (or fallback input) to pick a game install.
 *
 * @param options.game - Minecraft or Hytale, determines what files to collect
 * @param options.onPick - Callback invoked with the collected File[] array
 * @returns {hasFsApi} - True if the FS Access API is available
 * @returns {inputRef} - Attach to a hidden `<input type="file">` element
 * @returns {inputProps} - Spread onto the same input; includes multiple/accept/onChange
 * @returns {pick} - Call this to trigger the picker (FS API or input fallback)
 */
export function useInstanceFilePicker({
  game,
  onPick,
}: UseInstanceFilePickerOptions): UseInstanceFilePickerReturn {
  const inputRef = useRef<HTMLInputElement>(null);

  // Resolved after mount, never during render: reading `window` inline makes the
  // server (always false) and the client (usually true) disagree on the input's
  // `multiple`, which React reports as a hydration mismatch.
  const [hasFsApi, setHasFsApi] = useState(false);
  useEffect(() => {
    setHasFsApi(!!getDirectoryPicker());
  }, []);

  const meta = gameMeta(game);
  // Only set folder-picker attributes (webkitdirectory) when the game's expected
  // picker kind IS a folder (Minecraft) and we must fall back to the input API.
  const fallbackIsFolder =
    !hasFsApi && meta.pickerKind === "instance-folder";

  // Set or remove webkitdirectory/directory attributes based on the fallback mode.
  // Both attributes are needed for broad browser support (webkit and standards).
  useEffect(() => {
    if (inputRef.current) {
      if (fallbackIsFolder) {
        inputRef.current.setAttribute("webkitdirectory", "");
        inputRef.current.setAttribute("directory", "");
      } else {
        inputRef.current.removeAttribute("webkitdirectory");
        inputRef.current.removeAttribute("directory");
      }
    }
  }, [fallbackIsFolder]);

  // Trigger the picker: try FS Access API first, fall back to input element.
  async function pick() {
    if (hasFsApi) {
      const picker = getDirectoryPicker();
      if (!picker) return;
      try {
        const dir = await picker();
        onPick(await collectFromDirectory(dir, game));
      } catch {
        // User dismissed the picker — nothing to do.
      }
      return;
    }
    inputRef.current?.click();
  }

  // Props to spread onto the hidden input: multiple/accept depend on the game and
  // whether we're in fallback mode. onChange delegates to collectFromFileList.
  const inputProps = {
    multiple: fallbackIsFolder,
    accept: !hasFsApi ? meta.fallbackAccept : undefined,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length) onPick(collectFromFileList(files, game));
      e.target.value = "";
    },
  };

  return { hasFsApi, inputRef, inputProps, pick };
}
