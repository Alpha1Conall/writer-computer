import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Cancel01Icon,
  File02Icon,
  FolderLibraryIcon,
  Search01Icon,
} from "@hugeicons/core-free-icons";
import { useGlobalRecentFiles } from "@/hooks/use-global-recent-files";
import { useActiveFilePath } from "@/hooks/use-tabs";
import { getFileStem } from "@/lib/paths";
import { formatRelativeTime } from "@/lib/relative-time";
import * as tauri from "@/lib/tauri";
import type { RecentFile } from "@/lib/tauri";

interface CompactRecentsListProps {
  openFile: (path: string) => Promise<void>;
  onOpenFileComplete?: () => void;
  className?: string;
}

function recentLabel(entry: RecentFile) {
  return entry.title || getFileStem(entry.name);
}

/** Picker content for standalone compact windows: a search field over the
 *  global recents list (each removable) plus an "Open other file…" escape
 *  hatch. No workspace data involved. */
export function CompactRecentsList({
  openFile,
  onOpenFileComplete,
  className,
}: CompactRecentsListProps) {
  const { files: recentFiles, remove } = useGlobalRecentFiles();
  const activeFilePath = useActiveFilePath();
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  // Focus the search field once the picker has mounted its content.
  useEffect(() => {
    const id = requestAnimationFrame(() => searchRef.current?.focus());
    return () => cancelAnimationFrame(id);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return recentFiles;
    return recentFiles.filter(
      (entry) =>
        recentLabel(entry).toLowerCase().includes(q) ||
        entry.name.toLowerCase().includes(q) ||
        entry.path.toLowerCase().includes(q),
    );
  }, [query, recentFiles]);

  const openFileAndComplete = useCallback(
    async (path: string) => {
      await openFile(path);
      onOpenFileComplete?.();
    },
    [onOpenFileComplete, openFile],
  );

  const handlePickFile = useCallback(() => {
    void (async () => {
      const picked = await tauri.pickFile();
      if (picked) await openFileAndComplete(picked);
    })();
  }, [openFileAndComplete]);

  return (
    <div className={className}>
      <div className="flex items-center gap-2 rounded-lg px-2.5 py-1.5">
        <HugeiconsIcon
          icon={Search01Icon}
          size={16}
          color="currentColor"
          strokeWidth={1.8}
          className="shrink-0 text-[var(--text-icon-muted)]"
        />
        <input
          ref={searchRef}
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search recent files"
          spellCheck={false}
          autoComplete="off"
          className="min-w-0 flex-1 bg-transparent text-[13px] leading-[1.15] text-[var(--fg-base)] outline-none placeholder:text-[var(--text-muted)]"
        />
      </div>

      <div className="h-px bg-[var(--line-subtler)]" />

      {filtered.length > 0 ? (
        <div role="list" aria-label="Recent files" className="flex flex-col gap-px">
          {filtered.map((entry) => (
            <RecentFileRow
              key={entry.path}
              entry={entry}
              isActive={entry.path === activeFilePath}
              onOpen={openFileAndComplete}
              onRemove={remove}
            />
          ))}
        </div>
      ) : (
        <div className="px-2.5 py-3 text-[13px] text-[var(--text-muted)]">
          {recentFiles.length === 0 ? "No recent files." : "No matches."}
        </div>
      )}

      <button
        type="button"
        onClick={handlePickFile}
        className="group flex h-[36px] w-full items-center gap-1.5 rounded-lg pl-[10px] pr-2 text-left text-[13px] leading-[1.15] text-[var(--fg-base)] hover:bg-[var(--surface-subtle)]"
      >
        <span className="flex w-5 shrink-0 items-center justify-center opacity-60 group-hover:opacity-100">
          <HugeiconsIcon
            icon={FolderLibraryIcon}
            size={16}
            color="currentColor"
            strokeWidth={1.8}
          />
        </span>
        <span className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap opacity-60 group-hover:opacity-100">
          Open other file…
        </span>
      </button>
    </div>
  );
}

interface RecentFileRowProps {
  entry: RecentFile;
  isActive: boolean;
  onOpen: (path: string) => Promise<void>;
  onRemove: (path: string) => void;
}

function RecentFileRow({ entry, isActive, onOpen, onRemove }: RecentFileRowProps) {
  const label = recentLabel(entry);
  const openedAgo = formatRelativeTime(entry.opened_at);

  return (
    <div
      className={`group relative flex items-stretch rounded-lg ${
        isActive ? "bg-[var(--surface-subtle)]" : "hover:bg-[var(--surface-subtle)]"
      }`}
    >
      <button
        type="button"
        onClick={() => void onOpen(entry.path)}
        className="flex min-w-0 flex-1 items-center gap-2 rounded-lg py-1.5 pl-[10px] pr-8 text-left"
      >
        <span
          className="flex w-5 shrink-0 items-center justify-center antialiased text-[var(--text-icon-muted)]"
          aria-hidden="true"
        >
          <HugeiconsIcon icon={File02Icon} size={16} color="currentColor" strokeWidth={1.8} />
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="overflow-hidden text-ellipsis whitespace-nowrap text-[13px] leading-[1.2] text-[var(--fg-base)]">
            {label}
          </span>
          {openedAgo && (
            <span className="overflow-hidden text-ellipsis whitespace-nowrap text-[12px] leading-[1.2] text-[var(--text-muted)]">
              {openedAgo}
            </span>
          )}
        </span>
      </button>
      <button
        type="button"
        aria-label={`Remove ${label} from recents`}
        onClick={() => onRemove(entry.path)}
        className="absolute right-1.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-[var(--text-icon-muted)] opacity-0 transition-opacity hover:bg-[var(--surface-elevated)] hover:text-[var(--fg-base)] group-hover:opacity-100 focus-visible:opacity-100"
      >
        <HugeiconsIcon icon={Cancel01Icon} size={14} color="currentColor" strokeWidth={2} />
      </button>
    </div>
  );
}
