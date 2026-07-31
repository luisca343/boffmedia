use std::{env, fs, path::PathBuf};

// Generates Rust types for the pack manifest from the JSON Schema that
// packages/pack-schema emits from its zod definitions. zod is the single source
// of truth for the format; this keeps the launcher from drifting away from what
// the dashboard publishes (HANDOFF §4.4).
//
// The schema file is committed, so this builds without Node installed.
fn main() {
    // api.rs bakes this in with option_env!, and cargo does NOT track env vars
    // read that way on its own. Without this line, switching build profiles
    // reuses the previous binary and silently ships the wrong API host.
    println!("cargo:rerun-if-env-changed=BOFF_API_URL");
    // Same trap, same fix: updates.rs reads this with option_env!, so without
    // the line a portable build reuses an installed build's object files (or
    // the other way round) and ships with the wrong updater behaviour.
    println!("cargo:rerun-if-env-changed=BOFF_PORTABLE");

    let schema_path = PathBuf::from("../../../packages/pack-schema/schema/pack-manifest.schema.json");
    println!("cargo:rerun-if-changed={}", schema_path.display());

    let raw = fs::read_to_string(&schema_path).unwrap_or_else(|e| {
        panic!(
            "cannot read {} ({e}). Run `pnpm --filter @boffmedia/pack-schema build` to generate it.",
            schema_path.display()
        )
    });
    let schema: schemars::schema::RootSchema =
        serde_json::from_str(&raw).expect("pack-manifest.schema.json is not valid JSON Schema");

    let mut type_space = typify::TypeSpace::new(
        typify::TypeSpaceSettings::default().with_struct_builder(false),
    );
    type_space
        .add_root_schema(schema)
        .expect("failed to convert the pack manifest schema into Rust types");

    let out = PathBuf::from(env::var("OUT_DIR").expect("OUT_DIR is always set by cargo"))
        .join("pack_schema.rs");
    fs::write(&out, type_space.to_stream().to_string()).expect("failed to write generated types");

    tauri_build::build()
}
