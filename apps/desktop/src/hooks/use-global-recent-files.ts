import { useEffect, useState } from "react";
import * as tauri from "@/lib/tauri";
import type { DirEntry } from "@/types/fs";

/** Global recently-opened files (cross-workspace, persisted in app data).
 *  Fetched whenever `enabled` becomes true (and on mount when it already
 *  is), so always-mounted consumers like the command palette refresh per
 *  open while per-open-mounted consumers fetch once. Entries are already
 *  pruned of deleted files server-side. */
export function useGlobalRecentFiles(limit = 30, enabled = true): DirEntry[] {
  const [files, setFiles] = useState<DirEntry[]>([]);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    void tauri
      .getRecentFilesGlobal(limit)
      .then((entries) => {
        if (!cancelled) setFiles(entries);
      })
      .catch((error: unknown) => {
        console.error("Failed to read global recent files", error);
      });
    return () => {
      cancelled = true;
    };
  }, [enabled, limit]);

  return files;
}
