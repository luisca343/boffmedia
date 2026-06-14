---
description: Run verification stages
agent: build
---

Run the janus verification pipeline.

Call `verify_run` to execute all configured verification stages (lint, test, e2e, etc.) sequentially with early exit.

If any stage fails:
1. Report the failure output
2. Suggest fixes based on the error
3. Ask if the user wants to fix and re-verify

If all stages pass, confirm the verification succeeded.
