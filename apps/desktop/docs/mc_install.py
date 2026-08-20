"""
Minecraft installer + launcher — reference implementation.

Handles: version manifest, version JSON (incl. inheritsFrom merging for mod
loaders), rule evaluation, library download, native extraction, asset objects,
Java selection, argument templating, and process spawn.

    pip install requests
    python mc_install.py install 1.21.4
    python mc_install.py launch  1.21.4 --offline Dev

Pair with mc_auth.py for real sessions:
    from mc_auth import silent_login, load_refresh_token
    _, session = silent_login(load_refresh_token())
    launch(root, "1.21.4", session.launch_args())
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import platform
import re
import shutil
import subprocess
import sys
import zipfile
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from typing import Any, Iterable

import requests

VERSION_MANIFEST = "https://piston-meta.mojang.com/mc/game/version_manifest_v2.json"
RESOURCES = "https://resources.download.minecraft.net"

LAUNCHER_NAME = "my-launcher"
LAUNCHER_VERSION = "0.1.0"
USER_AGENT = f"{LAUNCHER_NAME}/{LAUNCHER_VERSION} (contact: you@example.com)"

HTTP = requests.Session()
HTTP.headers.update({"User-Agent": USER_AGENT})

DOWNLOAD_THREADS = 16


# ---------------------------------------------------------------------------
# Environment
# ---------------------------------------------------------------------------

def current_os() -> str:
    if sys.platform.startswith("win"):
        return "windows"
    if sys.platform == "darwin":
        return "osx"
    return "linux"


def current_arch() -> str:
    machine = platform.machine().lower()
    if machine in ("amd64", "x86_64"):
        return "x86_64"
    if machine in ("arm64", "aarch64"):
        return "arm64"
    if machine in ("i386", "i686", "x86"):
        return "x86"
    return machine


OS_NAME = current_os()
ARCH = current_arch()
CLASSPATH_SEP = ";" if OS_NAME == "windows" else ":"


# ---------------------------------------------------------------------------
# Rule evaluation
#
# Used by both libraries and arguments. Start disallowed if rules exist, then
# every rule whose conditions match flips the verdict to its action. Last
# match wins.
# ---------------------------------------------------------------------------

def rules_allow(rules: list[dict] | None, features: dict[str, bool] | None = None) -> bool:
    if not rules:
        return True
    features = features or {}
    allowed = False

    for rule in rules:
        if not _rule_matches(rule, features):
            continue
        allowed = rule.get("action") == "allow"

    return allowed


def _rule_matches(rule: dict, features: dict[str, bool]) -> bool:
    os_cond = rule.get("os")
    if os_cond:
        if "name" in os_cond and os_cond["name"] != OS_NAME:
            return False
        if "arch" in os_cond and os_cond["arch"] != ARCH:
            return False
        if "version" in os_cond:
            if not re.search(os_cond["version"], platform.release()):
                return False

    feat_cond = rule.get("features")
    if feat_cond:
        for key, expected in feat_cond.items():
            if features.get(key, False) != expected:
                return False

    return True


# ---------------------------------------------------------------------------
# Downloading
# ---------------------------------------------------------------------------

def sha1_of(path: Path) -> str:
    h = hashlib.sha1()
    with path.open("rb") as fh:
        for chunk in iter(lambda: fh.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def download(url: str, dest: Path, sha1: str | None = None) -> None:
    """Idempotent: skips if the file exists and the hash matches."""
    if dest.exists():
        if sha1 is None or sha1_of(dest) == sha1:
            return
        dest.unlink()

    dest.parent.mkdir(parents=True, exist_ok=True)
    tmp = dest.with_suffix(dest.suffix + ".part")

    with HTTP.get(url, stream=True, timeout=60) as r:
        r.raise_for_status()
        with tmp.open("wb") as fh:
            for chunk in r.iter_content(1 << 16):
                fh.write(chunk)

    if sha1 and sha1_of(tmp) != sha1:
        tmp.unlink()
        raise RuntimeError(f"Hash mismatch for {url}")

    tmp.replace(dest)


def download_all(jobs: Iterable[tuple[str, Path, str | None]], label: str) -> None:
    jobs = list(jobs)
    if not jobs:
        return

    done = 0
    with ThreadPoolExecutor(max_workers=DOWNLOAD_THREADS) as pool:
        futures = {pool.submit(download, *job): job for job in jobs}
        for future in as_completed(futures):
            future.result()  # re-raise
            done += 1
            print(f"\r  {label}: {done}/{len(jobs)}", end="", flush=True)
    print()


# ---------------------------------------------------------------------------
# Version resolution
# ---------------------------------------------------------------------------

def version_json_path(root: Path, version_id: str) -> Path:
    return root / "versions" / version_id / f"{version_id}.json"


def fetch_version_json(root: Path, version_id: str) -> dict:
    """Fetch from the manifest if we don't already have it on disk."""
    dest = version_json_path(root, version_id)
    if dest.exists():
        return json.loads(dest.read_text(encoding="utf-8"))

    manifest = HTTP.get(VERSION_MANIFEST, timeout=30).json()
    entry = next((v for v in manifest["versions"] if v["id"] == version_id), None)
    if entry is None:
        raise RuntimeError(f"Unknown version: {version_id}")

    download(entry["url"], dest, entry.get("sha1"))
    return json.loads(dest.read_text(encoding="utf-8"))


def resolve_version(root: Path, version_id: str) -> dict:
    """
    Load a version JSON, following inheritsFrom.

    Mod loaders (Fabric, Quilt, Forge, NeoForge) ship a thin JSON that inherits
    from a vanilla version: child libraries come first, arguments concatenate,
    and scalar fields override.
    """
    data = fetch_version_json(root, version_id)
    parent_id = data.get("inheritsFrom")
    if not parent_id:
        return data

    parent = resolve_version(root, parent_id)
    merged = dict(parent)

    for key, value in data.items():
        if key == "inheritsFrom":
            continue
        if key == "libraries":
            merged["libraries"] = value + parent.get("libraries", [])
        elif key == "arguments":
            merged_args = dict(parent.get("arguments", {}))
            for arg_type in ("game", "jvm"):
                merged_args[arg_type] = (
                    parent.get("arguments", {}).get(arg_type, [])
                    + value.get(arg_type, [])
                )
            merged["arguments"] = merged_args
        else:
            merged[key] = value

    return merged


# ---------------------------------------------------------------------------
# Libraries
# ---------------------------------------------------------------------------

def maven_to_path(coords: str) -> str:
    """net.fabricmc:tiny-remapper:0.8.2 -> net/fabricmc/tiny-remapper/0.8.2/tiny-remapper-0.8.2.jar"""
    parts = coords.split(":")
    group, artifact, version = parts[0], parts[1], parts[2]
    classifier = parts[3] if len(parts) > 3 else None

    name = f"{artifact}-{version}"
    if classifier:
        name += f"-{classifier}"

    return "/".join(group.split(".") + [artifact, version, name + ".jar"])


def library_jobs(root: Path, libraries: list[dict]) -> tuple[list[tuple], list[Path], list[dict]]:
    """Returns (download jobs, classpath entries, legacy native libs)."""
    lib_dir = root / "libraries"
    jobs: list[tuple] = []
    classpath: list[Path] = []
    natives: list[dict] = []

    for lib in libraries:
        if not rules_allow(lib.get("rules")):
            continue

        downloads = lib.get("downloads", {})
        artifact = downloads.get("artifact")

        if artifact:
            path = lib_dir / artifact["path"]
            jobs.append((artifact["url"], path, artifact.get("sha1")))
            classpath.append(path)
        elif "name" in lib and "url" in lib:
            # Loader-style entry: maven base URL + coordinates, no hashes.
            rel = maven_to_path(lib["name"])
            path = lib_dir / rel
            jobs.append((lib["url"].rstrip("/") + "/" + rel, path, None))
            classpath.append(path)

        # Legacy natives (pre ~1.19): a classifier jar that must be extracted.
        if "natives" in lib:
            key = lib["natives"].get(OS_NAME)
            if key:
                key = key.replace("${arch}", "64" if ARCH in ("x86_64", "arm64") else "32")
                native = downloads.get("classifiers", {}).get(key)
                if native:
                    path = lib_dir / native["path"]
                    jobs.append((native["url"], path, native.get("sha1")))
                    natives.append({"path": path, "extract": lib.get("extract", {})})

    return jobs, classpath, natives


def extract_natives(natives: list[dict], target: Path) -> None:
    if not natives:
        return
    if target.exists():
        shutil.rmtree(target)
    target.mkdir(parents=True, exist_ok=True)

    for entry in natives:
        exclude = entry.get("extract", {}).get("exclude", [])
        with zipfile.ZipFile(entry["path"]) as zf:
            for member in zf.namelist():
                if member.endswith("/"):
                    continue
                if any(member.startswith(prefix) for prefix in exclude):
                    continue
                zf.extract(member, target)


# ---------------------------------------------------------------------------
# Assets
# ---------------------------------------------------------------------------

def install_assets(root: Path, version: dict) -> None:
    index_info = version.get("assetIndex")
    if not index_info:
        return

    index_path = root / "assets" / "indexes" / f"{index_info['id']}.json"
    download(index_info["url"], index_path, index_info.get("sha1"))
    index = json.loads(index_path.read_text(encoding="utf-8"))

    objects_dir = root / "assets" / "objects"
    jobs = []
    for obj in index.get("objects", {}).values():
        h = obj["hash"]
        jobs.append((f"{RESOURCES}/{h[:2]}/{h}", objects_dir / h[:2] / h, h))

    download_all(jobs, "assets")

    # Pre-1.7 packs need a readable tree rather than hashed blobs.
    if index.get("virtual") or index.get("map_to_resources"):
        base = root / "assets" / "virtual" / index_info["id"]
        for name, obj in index.get("objects", {}).items():
            h = obj["hash"]
            dest = base / name
            if not dest.exists():
                dest.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy(objects_dir / h[:2] / h, dest)


# ---------------------------------------------------------------------------
# Java
# ---------------------------------------------------------------------------

def java_major(java_exe: str) -> int | None:
    try:
        out = subprocess.run(
            [java_exe, "-version"], capture_output=True, text=True, timeout=15
        ).stderr
    except (OSError, subprocess.SubprocessError):
        return None

    match = re.search(r'version "(\d+)(?:\.(\d+))?', out)
    if not match:
        return None
    major = int(match.group(1))
    # 1.8.0_xxx style
    return int(match.group(2)) if major == 1 and match.group(2) else major


def find_java(required_major: int) -> str:
    """
    Finds a usable JRE. A real launcher should download and manage its own —
    see https://api.adoptium.net/v3/binary/latest/{major}/ga/{os}/{arch}/jre/hotspot/normal/eclipse
    which is a stable, documented endpoint for per-platform Temurin builds.
    """
    candidates = [os.environ.get("JAVA_HOME"), None]
    for base in candidates:
        exe = (
            str(Path(base) / "bin" / ("java.exe" if OS_NAME == "windows" else "java"))
            if base else shutil.which("java")
        )
        if not exe:
            continue
        found = java_major(exe)
        if found is None:
            continue
        if found >= required_major:
            return exe
        print(f"  [warn] {exe} is Java {found}, need {required_major}+")

    raise RuntimeError(
        f"No Java {required_major}+ found. Install Temurin {required_major} "
        f"or set JAVA_HOME."
    )


# ---------------------------------------------------------------------------
# Install
# ---------------------------------------------------------------------------

def install(root: Path, version_id: str) -> dict:
    version = resolve_version(root, version_id)
    print(f"Installing {version_id} (assets {version.get('assets')}, "
          f"Java {version.get('javaVersion', {}).get('majorVersion', '?')})")

    client = version.get("downloads", {}).get("client")
    if client:
        jar = root / "versions" / version_id / f"{version_id}.jar"
        download(client["url"], jar, client.get("sha1"))
        print("  client.jar ok")

    jobs, _, natives = library_jobs(root, version.get("libraries", []))
    download_all(jobs, "libraries")
    extract_natives(natives, root / "versions" / version_id / "natives")

    install_assets(root, version)
    print("Done.")
    return version


# ---------------------------------------------------------------------------
# Argument building
# ---------------------------------------------------------------------------

def flatten_arguments(entries: list, features: dict[str, bool]) -> list[str]:
    """arguments.game / arguments.jvm entries are strings or {rules, value}."""
    out: list[str] = []
    for entry in entries:
        if isinstance(entry, str):
            out.append(entry)
            continue
        if not rules_allow(entry.get("rules"), features):
            continue
        value = entry.get("value", [])
        out.extend([value] if isinstance(value, str) else value)
    return out


def substitute(args: list[str], values: dict[str, str]) -> list[str]:
    out = []
    for arg in args:
        for key, val in values.items():
            arg = arg.replace("${" + key + "}", str(val))
        out.append(arg)
    return out


def build_command(
    root: Path,
    version_id: str,
    auth: dict[str, str],
    memory_mb: int = 4096,
    features: dict[str, bool] | None = None,
) -> list[str]:
    version = resolve_version(root, version_id)
    features = features or {}

    _, classpath, _ = library_jobs(root, version.get("libraries", []))
    classpath.append(root / "versions" / version_id / f"{version_id}.jar")

    required = version.get("javaVersion", {}).get("majorVersion", 8)
    java = find_java(required)

    placeholders = {
        # identity — supplied by mc_auth.py
        "auth_player_name": auth.get("auth_player_name", "Player"),
        "auth_uuid": auth.get("auth_uuid", "0" * 32),
        "auth_access_token": auth.get("auth_access_token", "0"),
        "auth_xuid": auth.get("auth_xuid", ""),
        "clientid": auth.get("clientid", ""),
        "user_type": auth.get("user_type", "msa"),
        "auth_session": "token:" + auth.get("auth_access_token", "0"),  # legacy
        # paths
        "game_directory": str(root),
        "assets_root": str(root / "assets"),
        "game_assets": str(root / "assets" / "virtual" / str(version.get("assets"))),
        "assets_index_name": str(version.get("assets", "legacy")),
        "natives_directory": str(root / "versions" / version_id / "natives"),
        "library_directory": str(root / "libraries"),
        # version + launcher
        "version_name": version_id,
        "version_type": version.get("type", "release"),
        "launcher_name": LAUNCHER_NAME,
        "launcher_version": LAUNCHER_VERSION,
        # classpath
        "classpath": CLASSPATH_SEP.join(str(p) for p in classpath),
        "classpath_separator": CLASSPATH_SEP,
    }

    if "arguments" in version:
        jvm_args = flatten_arguments(version["arguments"].get("jvm", []), features)
        game_args = flatten_arguments(version["arguments"].get("game", []), features)
    else:
        # Pre-1.13: no jvm block at all, and a flat argument string.
        jvm_args = ["-Djava.library.path=${natives_directory}", "-cp", "${classpath}"]
        game_args = version.get("minecraftArguments", "").split()

    memory = [f"-Xmx{memory_mb}M", f"-Xms{min(memory_mb, 512)}M"]

    return (
        [java]
        + memory
        + substitute(jvm_args, placeholders)
        + [version["mainClass"]]
        + substitute(game_args, placeholders)
    )


# ---------------------------------------------------------------------------
# Launch
# ---------------------------------------------------------------------------

def launch(root: Path, version_id: str, auth: dict[str, str], **kwargs) -> int:
    command = build_command(root, version_id, auth, **kwargs)

    root.mkdir(parents=True, exist_ok=True)
    proc = subprocess.Popen(
        command,
        cwd=root,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        errors="replace",
        bufsize=1,
    )

    assert proc.stdout is not None
    for line in proc.stdout:
        print(line, end="")

    code = proc.wait()
    if code != 0:
        print(f"\nGame exited with code {code}")
    return code


def offline_identity(name: str) -> dict[str, str]:
    """
    Development stub so you can test the install pipeline before Microsoft
    approves your app registration.

    This is NOT a substitute for real auth — it cannot join online-mode servers.
    Gate it behind a dev flag; do not ship it as a general 'play without an
    account' option.
    """
    import uuid
    offline_uuid = uuid.uuid3(uuid.NAMESPACE_OID, f"OfflinePlayer:{name}")
    return {
        "auth_player_name": name,
        "auth_uuid": offline_uuid.hex,
        "auth_access_token": "0",
        "auth_xuid": "",
        "clientid": "",
        "user_type": "legacy",
    }


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main() -> int:
    parser = argparse.ArgumentParser(description="Minecraft installer + launcher")
    parser.add_argument("command", choices=["install", "launch"])
    parser.add_argument("version")
    parser.add_argument("--root", default=None, help="game directory")
    parser.add_argument("--offline", metavar="NAME", help="dev stub identity")
    parser.add_argument("--memory", type=int, default=4096, help="max heap in MB")
    args = parser.parse_args()

    root = Path(args.root) if args.root else Path.home() / ".my-launcher" / "default"
    root.mkdir(parents=True, exist_ok=True)

    if args.command == "install":
        install(root, args.version)
        return 0

    install(root, args.version)

    if args.offline:
        auth = offline_identity(args.offline)
    else:
        try:
            from mc_auth import silent_login, load_refresh_token, interactive_login
            token = load_refresh_token()
            _, session = silent_login(token) if token else interactive_login()
            auth = session.launch_args()
        except Exception as exc:
            print(f"Auth unavailable ({exc}); use --offline NAME for now.", file=sys.stderr)
            return 1

    return launch(root, args.version, auth, memory_mb=args.memory)


if __name__ == "__main__":
    raise SystemExit(main())
