import type { ErrCode } from "../errors";
import type { SliceSet } from "./types";

export interface ErrorSlice {
  /** Human-readable detail of the last failure (already stripped of its code). */
  error?: string;
  /** Machine code of the last failure, when it carried one — the UI translates it. */
  errorCode?: ErrCode;
  setError: (msg: string | undefined, code?: ErrCode) => void;
}

export function createErrorSlice(set: SliceSet<ErrorSlice>): ErrorSlice {
  return {
    error: undefined,
    errorCode: undefined,
    setError: (msg, code) => set({ error: msg, errorCode: code }),
  };
}
