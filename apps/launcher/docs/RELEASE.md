# Launcher releases

The launcher updater uses Tauri's signed updater artifacts. The public key is
committed in `src-tauri/tauri.conf.json`; the private key must never enter git.
Normal local builds do not create updater artifacts. The release workflow merges
`src-tauri/tauri.release.conf.json`, which enables artifact generation only when
the signing secret is available.

## Signing key

The local development key is kept at `~/.tauri/boff-launcher.key`. Generate a
replacement with:

```powershell
pnpm --filter launcher exec tauri signer generate -w $env:USERPROFILE\.tauri\boff-launcher.key
```

If the key changes, replace `plugins.updater.pubkey` with the contents of the
`.pub` file and store the private key in the GitHub secret
`TAURI_SIGNING_PRIVATE_KEY`.

## GitHub secrets

- `TAURI_SIGNING_PRIVATE_KEY`: the complete Tauri private key
- `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`: empty only for an intentionally unencrypted key
- `WINDOWS_CERTIFICATE`: base64-encoded `.pfx` certificate
- `WINDOWS_CERTIFICATE_PASSWORD`: password for the `.pfx`
- `WINDOWS_CERTIFICATE_THUMBPRINT`: SHA-1 thumbprint without spaces

The certificate secrets are optional for preview builds, but production builds
should set all three so Windows can identify Boffmedia as the publisher.

## Publish

Update `apps/launcher/src-tauri/tauri.conf.json`'s version, then push a tag:

```bash
git tag launcher-v0.0.2
git push github launcher-v0.0.2
```

The workflow creates a draft GitHub release containing the Windows installer and
`latest.json`. Publish the draft only after installing the artifact on a clean
Windows machine.
