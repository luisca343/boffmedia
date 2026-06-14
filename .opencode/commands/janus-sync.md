---
description: BookStack sync operations (push/pull/status)
agent: build
---

Perform a BookStack sync operation.

The user requested: $ARGUMENTS

Determine the operation from the user's request:
- If "push": call `sync_push` to push local specs to BookStack
- If "pull": call `sync_pull` to pull remote content locally
- If "status" or not specified: call `sync_status` to compare local vs remote

Report the results: what was synced, what changed, any conflicts.
