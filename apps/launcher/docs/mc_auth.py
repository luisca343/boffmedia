"""
Minecraft (Java Edition) authentication chain — reference implementation.

Flow:  MS OAuth2 (device code) -> Xbox Live -> XSTS -> Minecraft -> profile

Requires an approved Azure app registration. Until Microsoft approves it,
step 4 (login_with_xbox) returns 403 "Invalid app registration" — that is the
expected outcome and is the proof of activity Microsoft wants before review.

    pip install requests
    pip install keyring          # optional, for OS credential storage

    python mc_auth.py login
    python mc_auth.py whoami
    python mc_auth.py logout
"""

from __future__ import annotations

import argparse
import json
import sys
import time
from dataclasses import dataclass, asdict
from typing import Any

import requests

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

CLIENT_ID = "00000000-0000-0000-0000-000000000000"  # <-- your Entra client ID
SCOPE = "XboxLive.signin offline_access"

# NOTE: 'consumers', not 'common' and not your tenant ID.
MS_DEVICECODE = "https://login.microsoftonline.com/consumers/oauth2/v2.0/devicecode"
MS_TOKEN = "https://login.microsoftonline.com/consumers/oauth2/v2.0/token"

XBL_AUTH = "https://user.auth.xboxlive.com/user/authenticate"
XSTS_AUTH = "https://xsts.auth.xboxlive.com/xsts/authorize"
MC_LOGIN = "https://api.minecraftservices.com/authentication/login_with_xbox"
MC_PROFILE = "https://api.minecraftservices.com/minecraft/profile"
MC_ENTITLEMENTS = "https://api.minecraftservices.com/entitlements/mcstore"

USER_AGENT = "MyLauncher/0.1 (contact: you@example.com)"

TIMEOUT = 30

XERR_MESSAGES = {
    "2148916227": "This account has been banned from Xbox services.",
    "2148916233": (
        "This Microsoft account has no Xbox profile. Sign in at "
        "https://www.xbox.com once to create one, then try again."
    ),
    "2148916235": "Xbox Live is not available in this account's country/region.",
    "2148916236": "This account requires adult verification (South Korea).",
    "2148916237": "This account requires adult verification (South Korea).",
    "2148916238": (
        "This account is registered to a user under 18. An adult must add it "
        "to a Microsoft Family group before it can sign in."
    ),
}


class AuthError(Exception):
    """Any failure in the auth chain, with a message fit to show a user."""


# ---------------------------------------------------------------------------
# Result types
# ---------------------------------------------------------------------------

@dataclass
class MicrosoftTokens:
    access_token: str
    refresh_token: str
    expires_at: float  # unix seconds


@dataclass
class XboxToken:
    token: str
    user_hash: str
    xuid: str | None = None


@dataclass
class MinecraftSession:
    """Everything the launch command needs."""
    access_token: str
    uuid: str          # 32-hex, no dashes
    username: str
    xuid: str | None
    expires_at: float

    def launch_args(self, client_id: str = CLIENT_ID) -> dict[str, str]:
        """Values for the ${...} placeholders in the version JSON."""
        return {
            "auth_player_name": self.username,
            "auth_uuid": self.uuid,
            "auth_access_token": self.access_token,
            "auth_xuid": self.xuid or "",
            "clientid": client_id,
            "user_type": "msa",
        }


# ---------------------------------------------------------------------------
# HTTP helper
# ---------------------------------------------------------------------------

def _session() -> requests.Session:
    s = requests.Session()
    s.headers.update({"User-Agent": USER_AGENT, "Accept": "application/json"})
    return s


HTTP = _session()


# ---------------------------------------------------------------------------
# Step 1 — Microsoft OAuth2 (device code flow)
# ---------------------------------------------------------------------------

def start_device_code() -> dict[str, Any]:
    r = HTTP.post(
        MS_DEVICECODE,
        data={"client_id": CLIENT_ID, "scope": SCOPE},
        timeout=TIMEOUT,
    )
    if r.status_code != 200:
        raise AuthError(f"Could not start device login: {r.status_code} {r.text}")
    return r.json()


def poll_for_token(device_code: str, interval: int, expires_in: int) -> MicrosoftTokens:
    """Poll the token endpoint until the user completes the browser step."""
    deadline = time.time() + expires_in
    wait = max(interval, 1)

    while time.time() < deadline:
        time.sleep(wait)
        r = HTTP.post(
            MS_TOKEN,
            data={
                "grant_type": "urn:ietf:params:oauth:grant-type:device_code",
                "client_id": CLIENT_ID,
                "device_code": device_code,
            },
            timeout=TIMEOUT,
        )
        body = r.json()

        if r.status_code == 200:
            return MicrosoftTokens(
                access_token=body["access_token"],
                refresh_token=body["refresh_token"],
                expires_at=time.time() + body.get("expires_in", 3600),
            )

        error = body.get("error")
        if error == "authorization_pending":
            continue
        if error == "slow_down":
            wait += 5
            continue
        if error == "authorization_declined":
            raise AuthError("Sign-in was declined.")
        if error == "expired_token":
            raise AuthError("The device code expired. Start again.")
        raise AuthError(f"Sign-in failed: {error}: {body.get('error_description', '')}")

    raise AuthError("Timed out waiting for sign-in.")


def refresh_microsoft(refresh_token: str) -> MicrosoftTokens:
    r = HTTP.post(
        MS_TOKEN,
        data={
            "grant_type": "refresh_token",
            "client_id": CLIENT_ID,
            "refresh_token": refresh_token,
            "scope": SCOPE,
        },
        timeout=TIMEOUT,
    )
    if r.status_code != 200:
        # Refresh tokens are revoked on password change, MFA reset, etc.
        raise AuthError("Session expired. Please sign in again.")
    body = r.json()
    return MicrosoftTokens(
        access_token=body["access_token"],
        # Microsoft may or may not rotate the refresh token; keep the old one if not.
        refresh_token=body.get("refresh_token", refresh_token),
        expires_at=time.time() + body.get("expires_in", 3600),
    )


# ---------------------------------------------------------------------------
# Step 2 — Xbox Live user token
# ---------------------------------------------------------------------------

def authenticate_xbox(ms_access_token: str) -> XboxToken:
    payload = {
        "Properties": {
            "AuthMethod": "RPS",
            "SiteName": "user.auth.xboxlive.com",
            # The "d=" prefix is REQUIRED for Azure app tokens. Omitting it is
            # the single most common mistake in this chain.
            "RpsTicket": f"d={ms_access_token}",
        },
        "RelyingParty": "http://auth.xboxlive.com",
        "TokenType": "JWT",
    }
    r = HTTP.post(XBL_AUTH, json=payload, timeout=TIMEOUT)
    if r.status_code != 200:
        raise AuthError(f"Xbox Live rejected the sign-in ({r.status_code}).")

    body = r.json()
    return XboxToken(
        token=body["Token"],
        user_hash=body["DisplayClaims"]["xui"][0]["uhs"],
    )


# ---------------------------------------------------------------------------
# Step 3 — XSTS token for the Minecraft relying party
# ---------------------------------------------------------------------------

def authorize_xsts(xbl_token: str) -> XboxToken:
    payload = {
        "Properties": {"SandboxId": "RETAIL", "UserTokens": [xbl_token]},
        "RelyingParty": "rp://api.minecraftservices.com/",
        "TokenType": "JWT",
    }
    r = HTTP.post(XSTS_AUTH, json=payload, timeout=TIMEOUT)

    if r.status_code == 401:
        try:
            xerr = str(r.json().get("XErr", ""))
        except ValueError:
            xerr = ""
        raise AuthError(
            XERR_MESSAGES.get(xerr, f"Xbox authorization failed (XErr {xerr or 'unknown'}).")
        )
    if r.status_code != 200:
        raise AuthError(f"Xbox authorization failed ({r.status_code}).")

    body = r.json()
    claims = body["DisplayClaims"]["xui"][0]
    return XboxToken(
        token=body["Token"],
        user_hash=claims["uhs"],
        xuid=claims.get("xid"),  # needed later for ${auth_xuid}
    )


def fetch_xuid(xbl_token: str) -> tuple[str | None, str | None]:
    """
    The Minecraft relying party's XSTS claims contain only 'uhs'. The XUID and
    gamertag live on the xboxlive.com relying party, so it needs its own call
    against the same XBL user token.
    """
    payload = {
        "Properties": {"SandboxId": "RETAIL", "UserTokens": [xbl_token]},
        "RelyingParty": "http://xboxlive.com",
        "TokenType": "JWT",
    }
    try:
        r = HTTP.post(XSTS_AUTH, json=payload, timeout=TIMEOUT)
        if r.status_code != 200:
            return None, None
        claims = r.json().get("DisplayClaims", {}).get("xui", [{}])[0]
        return claims.get("xid"), claims.get("gtg")
    except requests.RequestException:
        return None, None


# ---------------------------------------------------------------------------
# Step 4 — Minecraft access token
# ---------------------------------------------------------------------------

def login_with_xbox(xsts: XboxToken) -> tuple[str, float]:
    payload = {"identityToken": f"XBL3.0 x={xsts.user_hash};{xsts.token}"}
    r = HTTP.post(MC_LOGIN, json=payload, timeout=TIMEOUT)

    if r.status_code == 403:
        raise AuthError(
            "Minecraft rejected this app registration.\n"
            "If you have not been approved yet, this is expected — submit\n"
            "https://aka.ms/mce-reviewappid with your Client ID and Tenant ID.\n"
            f"Raw: {r.text[:300]}"
        )
    if r.status_code != 200:
        raise AuthError(f"Minecraft login failed ({r.status_code}): {r.text[:300]}")

    body = r.json()
    # body["username"] here is an internal account ID, NOT the Minecraft name.
    return body["access_token"], time.time() + body.get("expires_in", 86400)


# ---------------------------------------------------------------------------
# Step 5 — Profile (and optional entitlement check)
# ---------------------------------------------------------------------------

def fetch_profile(mc_token: str) -> dict[str, Any]:
    r = HTTP.get(
        MC_PROFILE,
        headers={"Authorization": f"Bearer {mc_token}"},
        timeout=TIMEOUT,
    )
    if r.status_code == 404:
        raise AuthError(
            "No Minecraft Java Edition profile on this account.\n"
            "Either the account does not own the game, or it is a Game Pass\n"
            "account that has never signed into the official launcher to pick\n"
            "a username."
        )
    if r.status_code != 200:
        raise AuthError(f"Could not fetch profile ({r.status_code}).")
    return r.json()


def owns_game(mc_token: str) -> bool:
    """Entitlement check. Unreliable for Game Pass — prefer the profile call."""
    r = HTTP.get(
        MC_ENTITLEMENTS,
        headers={"Authorization": f"Bearer {mc_token}"},
        timeout=TIMEOUT,
    )
    return r.status_code == 200 and bool(r.json().get("items"))


# ---------------------------------------------------------------------------
# Orchestration
# ---------------------------------------------------------------------------

def complete_chain(ms: MicrosoftTokens) -> MinecraftSession:
    """MS token -> full Minecraft session. Steps 2 through 5."""
    xbl = authenticate_xbox(ms.access_token)
    xsts = authorize_xsts(xbl.token)
    mc_token, mc_expiry = login_with_xbox(xsts)
    profile = fetch_profile(mc_token)

    xuid = xsts.xuid
    if not xuid:
        xuid, _gamertag = fetch_xuid(xbl.token)

    return MinecraftSession(
        access_token=mc_token,
        uuid=profile["id"],
        username=profile["name"],
        xuid=xuid,
        expires_at=mc_expiry,
    )


def interactive_login() -> tuple[MicrosoftTokens, MinecraftSession]:
    flow = start_device_code()
    print(f"\n  Open: {flow['verification_uri']}")
    print(f"  Code: {flow['user_code']}\n")
    ms = poll_for_token(flow["device_code"], flow.get("interval", 5), flow.get("expires_in", 900))
    return ms, complete_chain(ms)


def silent_login(refresh_token: str) -> tuple[MicrosoftTokens, MinecraftSession]:
    """Startup path: no user interaction if the refresh token still works."""
    ms = refresh_microsoft(refresh_token)
    return ms, complete_chain(ms)


# ---------------------------------------------------------------------------
# Credential storage
#
# Store ONLY the refresh token, and put it in the OS credential store.
# A refresh token is effectively the account — plaintext JSON in a config
# directory is a real account-theft vector and several launchers have shipped it.
# ---------------------------------------------------------------------------

SERVICE = "my-launcher"
ACCOUNT = "microsoft-refresh-token"


def save_refresh_token(token: str) -> None:
    try:
        import keyring
        keyring.set_password(SERVICE, ACCOUNT, token)
    except Exception as exc:
        print(f"[warn] could not use OS keychain ({exc}); token not persisted", file=sys.stderr)


def load_refresh_token() -> str | None:
    try:
        import keyring
        return keyring.get_password(SERVICE, ACCOUNT)
    except Exception as exc:
        # Never swallow this: a broken keychain looks exactly like a first run,
        # and you would silently re-authenticate on every launch forever.
        print(f"[warn] keychain read failed: {exc}", file=sys.stderr)
        return None


def clear_refresh_token() -> None:
    try:
        import keyring
        keyring.delete_password(SERVICE, ACCOUNT)
    except Exception:
        pass


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main() -> int:
    parser = argparse.ArgumentParser(description="Minecraft auth chain reference")
    parser.add_argument("command", choices=["login", "whoami", "logout"])
    args = parser.parse_args()

    if args.command == "logout":
        clear_refresh_token()
        print("Signed out.")
        return 0

    try:
        stored = load_refresh_token()
        if stored:
            try:
                ms, session = silent_login(stored)
            except AuthError as exc:
                print(f"[info] silent login failed ({exc}); signing in again")
                ms, session = interactive_login()
        else:
            ms, session = interactive_login()

        save_refresh_token(ms.refresh_token)

    except AuthError as exc:
        print(f"\n{exc}\n", file=sys.stderr)
        return 1

    print(f"Signed in as {session.username}  ({session.uuid})")
    if args.command == "whoami":
        print(json.dumps(asdict(session) | {"access_token": "<redacted>"}, indent=2))
        print("\nLaunch placeholders:")
        for k, v in session.launch_args().items():
            shown = "<redacted>" if k == "auth_access_token" else v
            print(f"  ${{{k}}} = {shown}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
