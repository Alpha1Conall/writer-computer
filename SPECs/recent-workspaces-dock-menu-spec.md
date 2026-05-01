# Recent Workspaces Dock Menu Spec

## Status

Shipped 2026-04-30.

## Summary

Show Writer's existing recent workspace list in the macOS Dock icon context menu so a user can reopen or focus a workspace without first switching to an app window.

## Goals

- Add recent workspace menu items above macOS' built-in Dock menu items.
- Reuse the existing `recent_workspaces.json` list and workspace-opening path.
- Selecting an already-open workspace focuses its window instead of duplicating it.
- Keep the feature macOS-only; other platforms are unchanged.

## Non-Goals

- Redesign the in-app workspace switcher.
- Add Windows jump-list or Linux launcher integrations.
- Add user-configurable recent workspace limits.

## UX Decisions

- Show up to the existing persisted recent-workspace limit.
- Display each workspace by its folder name.
- Omit missing folders from the Dock menu rather than showing disabled stale entries.

## Acceptance Criteria

- Right-clicking the Writer Dock icon shows recent workspaces before the default Options / Hide / Quit items.
- Clicking a recent workspace opens it in a new Writer window, or focuses the existing window for that workspace.
- Existing recent workspace IPC and sidebar behavior continue to work.
