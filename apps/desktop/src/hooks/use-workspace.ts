import { useWorkspaceStore } from "@/stores/workspace-store";
import { resolveWorkspaceChromeMode, useCompactModeSettingEnabled } from "@/lib/compact-mode";

export function useWorkspace() {
  const root = useWorkspaceStore((s) => s.root);
  const rawChromeMode = useWorkspaceStore((s) => s.chromeMode);
  const compactModeSettingEnabled = useCompactModeSettingEnabled();
  const chromeMode = resolveWorkspaceChromeMode(root, rawChromeMode, compactModeSettingEnabled);
  const isIndexing = useWorkspaceStore((s) => s.isIndexing);
  const openWorkspace = useWorkspaceStore((s) => s.openWorkspace);
  const closeWorkspace = useWorkspaceStore((s) => s.closeWorkspace);
  const recentWorkspaces = useWorkspaceStore((s) => s.recentWorkspaces);
  const removeRecentWorkspace = useWorkspaceStore((s) => s.removeRecentWorkspace);
  return {
    root,
    chromeMode,
    isIndexing,
    openWorkspace,
    closeWorkspace,
    recentWorkspaces,
    removeRecentWorkspace,
  };
}

export function useWorkspaceChromeMode() {
  const root = useWorkspaceStore((s) => s.root);
  const chromeMode = useWorkspaceStore((s) => s.chromeMode);
  const compactModeSettingEnabled = useCompactModeSettingEnabled();
  return resolveWorkspaceChromeMode(root, chromeMode, compactModeSettingEnabled);
}

export function useIsCompactFileMode() {
  return useWorkspaceChromeMode() === "compact-file";
}

export function useSetWorkspaceChromeMode() {
  return useWorkspaceStore((s) => s.setChromeMode);
}

export function useIsStartupResolved() {
  return useWorkspaceStore((s) => s.isStartupResolved);
}

export function useWorkspaceRoot() {
  return useWorkspaceStore((s) => s.root);
}
