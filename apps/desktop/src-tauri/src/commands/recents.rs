//! Global recently-opened-files list, shared by every window and workspace.
//!
//! Persisted as a JSON array of absolute paths in the app data dir
//! (`recent_files.json`), mirroring `recent_workspaces.json`. All
//! read-modify-write cycles hold `AppState::recent_files_lock` so two
//! windows recording opens concurrently can't drop each other's entries.

use crate::commands::fs::markdown_file_entry;
use crate::error::AppError;
use crate::state::AppState;
use std::path::{Path, PathBuf};
use tauri::Manager;

const MAX_RECENT_FILES: usize = 30;

fn recent_files_path(app: &tauri::AppHandle) -> Result<PathBuf, AppError> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|e| AppError::Io(e.to_string()))?;
    std::fs::create_dir_all(&dir)?;
    Ok(dir.join("recent_files.json"))
}

fn load_recent_files(app: &tauri::AppHandle) -> Vec<String> {
    let Ok(path) = recent_files_path(app) else {
        return Vec::new();
    };
    if !path.exists() {
        return Vec::new();
    }
    std::fs::read_to_string(&path)
        .ok()
        .and_then(|data| serde_json::from_str(&data).ok())
        .unwrap_or_default()
}

fn save_recent_files(app: &tauri::AppHandle, recents: &[String]) -> Result<(), AppError> {
    let path = recent_files_path(app)?;
    let data = serde_json::to_string_pretty(recents).map_err(|e| AppError::Io(e.to_string()))?;
    std::fs::write(&path, data)?;
    Ok(())
}

/// Pure list update: dedupe, push to front, cap. Extracted for unit testing.
fn push_recent(recents: &mut Vec<String>, path: String) {
    recents.retain(|p| p != &path);
    recents.insert(0, path);
    recents.truncate(MAX_RECENT_FILES);
}

fn is_markdown_file(path: &Path) -> bool {
    path.is_file()
        && path.extension().is_some_and(|ext| {
            ext.eq_ignore_ascii_case("md") || ext.eq_ignore_ascii_case("markdown")
        })
}

/// Record a file open into the global recents list. Non-markdown and
/// nonexistent paths are ignored rather than erroring — callers fire this
/// on every file activation and shouldn't have to pre-validate.
#[tauri::command]
pub fn record_recent_file(path: String, app: tauri::AppHandle) -> Result<(), AppError> {
    let file = PathBuf::from(&path);
    if !is_markdown_file(&file) {
        return Ok(());
    }
    let canonical = file
        .canonicalize()
        .unwrap_or(file)
        .to_string_lossy()
        .to_string();

    let state = app.state::<AppState>();
    let _guard = state.recent_files_lock.lock();
    let mut recents = load_recent_files(&app);
    push_recent(&mut recents, canonical);
    save_recent_files(&app, &recents)
}

/// Return the global recents as display-ready entries, most recent first.
/// Files that no longer exist are pruned from the persisted list so dead
/// entries don't accumulate.
#[tauri::command]
pub async fn get_recent_files_global(
    limit: Option<u32>,
    app: tauri::AppHandle,
) -> Result<Vec<crate::commands::fs::DirEntry>, AppError> {
    let limit = limit.unwrap_or(MAX_RECENT_FILES as u32).max(1) as usize;
    tauri::async_runtime::spawn_blocking(move || {
        let state = app.state::<AppState>();
        let _guard = state.recent_files_lock.lock();
        let recents = load_recent_files(&app);
        let alive: Vec<String> = recents
            .iter()
            .filter(|p| Path::new(p).is_file())
            .cloned()
            .collect();
        if alive.len() != recents.len() {
            let _ = save_recent_files(&app, &alive);
        }
        Ok(alive
            .iter()
            .take(limit)
            .filter_map(|p| markdown_file_entry(Path::new(p)))
            .collect())
    })
    .await
    .map_err(|e| AppError::Io(e.to_string()))?
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn push_recent_inserts_at_front() {
        let mut recents = vec!["/a.md".to_string(), "/b.md".to_string()];
        push_recent(&mut recents, "/c.md".to_string());
        assert_eq!(recents, vec!["/c.md", "/a.md", "/b.md"]);
    }

    #[test]
    fn push_recent_dedupes_existing_entry() {
        let mut recents = vec!["/a.md".to_string(), "/b.md".to_string()];
        push_recent(&mut recents, "/b.md".to_string());
        assert_eq!(recents, vec!["/b.md", "/a.md"]);
    }

    #[test]
    fn push_recent_caps_at_max() {
        let mut recents: Vec<String> = (0..MAX_RECENT_FILES)
            .map(|i| format!("/file-{i}.md"))
            .collect();
        push_recent(&mut recents, "/newest.md".to_string());
        assert_eq!(recents.len(), MAX_RECENT_FILES);
        assert_eq!(recents[0], "/newest.md");
        assert!(!recents.contains(&format!("/file-{}.md", MAX_RECENT_FILES - 1)));
    }

    #[test]
    fn is_markdown_file_rejects_non_markdown_and_missing() {
        let dir = tempfile::TempDir::new().unwrap();
        let md = dir.path().join("note.md");
        let txt = dir.path().join("note.txt");
        std::fs::write(&md, "# hi").unwrap();
        std::fs::write(&txt, "hi").unwrap();

        assert!(is_markdown_file(&md));
        assert!(!is_markdown_file(&txt));
        assert!(!is_markdown_file(&dir.path().join("missing.md")));
        assert!(!is_markdown_file(dir.path()));
    }
}
