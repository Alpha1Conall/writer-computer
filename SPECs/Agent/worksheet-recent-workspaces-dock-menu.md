# Worksheet: Recent Workspaces Dock Menu

## Task

- TODO: Recent workspaces Dock menu
- Spec: `SPECs/recent-workspaces-dock-menu-spec.md`

## Reviewed

- `TODOS.md`
- `SPECs/multi-window-spec.md`
- `docs/workflows/agent-loop.md`
- `apps/desktop/src-tauri/src/lib.rs`
- `apps/desktop/src-tauri/src/commands/workspace.rs`
- `apps/desktop/src-tauri/src/state.rs`
- `apps/desktop/src-tauri/Cargo.toml`
- Tauri 2.9 docs for macOS menu/window-menu APIs; no first-class Dock menu setter found.

## Plan

- Add a macOS-only `dock_menu` Rust module.
- Register `applicationDockMenu:` and a workspace action method on the existing AppKit delegate class.
- Build menu contents from `load_recent_workspaces`, filtering missing folders.
- Store the workspace path on each menu item and dispatch selection to `open_new_workspace_window`.
- Update docs/changelog and run Rust/frontend validation.

## Notes

- Worktree was clean at start.
- The screenshot is the macOS Dock icon context menu; this is not the in-app menu bar or sidebar menu.

## Implementation

- Added `apps/desktop/src-tauri/src/dock_menu.rs` behind `cfg(target_os = "macos")`.
- Registered AppKit delegate methods for `applicationDockMenu:` and recent-workspace item actions.
- Recent menu items use folder names, store the full path as `representedObject`, and call `open_new_workspace_window` on selection.
- Hardened the shared new-window path to reject deleted workspace folders and treat pending-open windows as already opening a workspace, preventing duplicate windows from rapid repeat opens.
- Added unit coverage for filtering missing recent workspace directories, title fallback, and pending-open duplicate detection.

## Validation

- `vp install` was required before frontend validation because dependencies were missing in this worktree.
- `vp check` passed after install with pre-existing warnings in settings/e2e files.
- `vp test` passed: 17 files / 257 tests.
- `cargo fmt --check` passed.
- Implementation review found and fixed stale-path and pending-window duplicate races.
- `cargo test` passed: 90 tests.
- `cargo clippy` passed with pre-existing warnings in unrelated files.
