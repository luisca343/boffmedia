#!/usr/bin/env bash
# Source this before any cargo command for src-tauri on WSL:
#   source apps/launcher/scripts/wsl-cargo-env.sh && cargo check
#
# The box has no sudo and no pkg-config, so the gtk/webkit/openssl dev headers
# were extracted rootless into $GTK via `apt-get download` + `dpkg-deb -x`.
# OPENSSL_LIB_DIR (not OPENSSL_DIR): Debian multiarch puts the .so one level
# deeper than openssl-sys's two guesses, and the panic names the dirs it tried.
GTK="${GTK:-$HOME/.local/gtkroot}"

# ~/.cargo/bin is only on PATH in a login shell; tool-run shells are not one.
export PATH="$HOME/.cargo/bin:$GTK/usr/bin:$PATH"
export PKG_CONFIG_PATH="$GTK/usr/lib/x86_64-linux-gnu/pkgconfig:$GTK/usr/share/pkgconfig"
export PKG_CONFIG_SYSROOT_DIR="$GTK"
export OPENSSL_LIB_DIR="$GTK/usr/lib/x86_64-linux-gnu"
export OPENSSL_INCLUDE_DIR="$GTK/usr/include"
export C_INCLUDE_PATH="$GTK/usr/include:$C_INCLUDE_PATH"
export LD_LIBRARY_PATH="$GTK/usr/lib/x86_64-linux-gnu:$LD_LIBRARY_PATH"
