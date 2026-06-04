import { useSettingsStore } from "@/stores/settings-store";
import type { WorkspaceChromeMode } from "@/stores/workspace-store";

export const COMPACT_MODE_SETTING_KEY = "appearance.compact-mode" as const;

export function isCompactModeSettingEnabled() {
  return useSettingsStore.getState().settings[COMPACT_MODE_SETTING_KEY] === true;
}

export function useCompactModeSettingEnabled() {
  return useSettingsStore((state) => state.settings[COMPACT_MODE_SETTING_KEY] === true);
}

export function resolveWorkspaceChromeMode(
  root: string | null,
  chromeMode: WorkspaceChromeMode,
  compactModeSettingEnabled: boolean,
): WorkspaceChromeMode {
  if (chromeMode === "compact-file") return "compact-file";
  if (!root) return "workspace";
  return compactModeSettingEnabled ? "compact-file" : "workspace";
}

export function getWorkspaceChromeMode(
  root: string | null,
  chromeMode: WorkspaceChromeMode,
): WorkspaceChromeMode {
  return resolveWorkspaceChromeMode(root, chromeMode, isCompactModeSettingEnabled());
}
