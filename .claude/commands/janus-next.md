---
description: Ask janus for the single most useful next step
---

Run `janus next --json` and act on the recommended step.

- If it is a human gate (e.g. spec approval), present it to the user instead of doing it.
- Otherwise run the suggested command and continue the loop.
