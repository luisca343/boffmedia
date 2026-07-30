// The pack manifest, as Rust. The TYPES are generated at build time from
// packages/pack-schema's JSON Schema — see build.rs — so the launcher cannot
// drift from what the dashboard publishes.
//
// The RULES below are hand-written on purpose. JSON Schema cannot express zod
// refinements, so `emit-schema.mjs` silently drops them; anything added to
// PackManifest as a `.superRefine` is invisible to the generated types and must
// be mirrored here. Today that is exactly one rule: duplicate target paths.
//
// If you add a refinement in boffmedia.ts, add it here too — nothing enforces
// that pairing automatically, which is why both files say so.

#![allow(clippy::all)]

include!(concat!(env!("OUT_DIR"), "/pack_schema.rs"));

use std::collections::HashSet;

#[derive(Debug, thiserror::Error)]
pub enum ManifestError {
    #[error("manifest is not valid JSON: {0}")]
    Json(#[from] serde_json::Error),
    #[error("two files target the same path (case-insensitively): {0}")]
    DuplicatePath(String),
    #[error("file path must be relative to the instance: {0}")]
    AbsolutePath(String),
    #[error("file path must not escape the instance directory: {0}")]
    PathTraversal(String),
}

/// Parse and fully validate a manifest — schema-level via serde, plus the
/// refinements the schema cannot carry. Prefer this over `serde_json::from_str`
/// so a manifest can never reach the installer half-checked.
pub fn parse_manifest(raw: &str) -> Result<PackManifest, ManifestError> {
    let manifest: PackManifest = serde_json::from_str(raw)?;
    validate_paths(&manifest)?;
    Ok(manifest)
}

/// Mirrors the `.superRefine` in packages/pack-schema/src/boffmedia.ts, plus a
/// defence-in-depth re-check of the path rules. The schema does encode those as
/// string patterns, but these values are used to WRITE TO DISK — a second check
/// on the client costs nothing and a compromised or buggy server is exactly the
/// case where it matters.
fn validate_paths(manifest: &PackManifest) -> Result<(), ManifestError> {
    let mut seen: HashSet<String> = HashSet::new();

    for file in &manifest.version.files {
        let path = file.path.as_str();

        if path.starts_with('/') || path.starts_with('\\') {
            return Err(ManifestError::AbsolutePath(path.to_string()));
        }
        // Windows drive-relative paths ("C:..."), which are not caught by a
        // leading-slash test.
        let bytes = path.as_bytes();
        if bytes.len() >= 2 && bytes[1] == b':' && bytes[0].is_ascii_alphabetic() {
            return Err(ManifestError::AbsolutePath(path.to_string()));
        }
        if path.split(['/', '\\']).any(|seg| seg == "..") {
            return Err(ManifestError::PathTraversal(path.to_string()));
        }

        // Case-insensitive: Windows and macOS would silently overwrite one file
        // with the other, while Linux would install both. A pack that installs
        // differently per platform is a pack that cannot be supported.
        let key = path.to_lowercase().replace('\\', "/");
        if !seen.insert(key) {
            return Err(ManifestError::DuplicatePath(path.to_string()));
        }
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    // Kept byte-identical in spirit with the vitest fixture in
    // packages/pack-schema/src/pack-schema.test.ts — the same inputs must be
    // rejected on both sides of the boundary.
    fn manifest_json(path: &str, extra: Option<&str>) -> String {
        let second = extra
            .map(|p| {
                format!(
                    r#",{{"path":"{p}","sha512":"{s}","fileSize":10,"env":{{"client":"required","server":"required"}},"source":{{"kind":"modrinth","projectId":"p","versionId":"v"}}}}"#,
                    s = "b".repeat(128)
                )
            })
            .unwrap_or_default();
        format!(
            r#"{{"formatVersion":1,
                "pack":{{"id":"pk","slug":"boff-smp","name":"Boff SMP","access":{{"kind":"public"}}}},
                "version":{{"id":"v1","name":"1.0","createdAt":"2026-07-30T12:00:00Z",
                  "dependencies":{{"minecraft":"1.21.4","neoforge":"21.4.30"}},
                  "files":[{{"path":"{path}","sha512":"{s}","fileSize":10,
                    "env":{{"client":"required","server":"required"}},
                    "source":{{"kind":"modrinth","projectId":"p","versionId":"v"}}}}{second}]}}}}"#,
            s = "a".repeat(128)
        )
    }

    #[test]
    fn accepts_a_well_formed_manifest() {
        assert!(parse_manifest(&manifest_json("mods/sodium.jar", None)).is_ok());
    }

    #[test]
    fn rejects_traversal() {
        let err = parse_manifest(&manifest_json("../../etc/passwd", None)).unwrap_err();
        assert!(matches!(err, ManifestError::PathTraversal(_)));
    }

    #[test]
    fn rejects_windows_drive_paths() {
        let err = parse_manifest(&manifest_json("C:/Windows/evil.dll", None)).unwrap_err();
        assert!(matches!(err, ManifestError::AbsolutePath(_)));
    }

    #[test]
    fn rejects_case_only_duplicate_paths() {
        let err =
            parse_manifest(&manifest_json("mods/sodium.jar", Some("mods/Sodium.jar"))).unwrap_err();
        assert!(matches!(err, ManifestError::DuplicatePath(_)));
    }
}
