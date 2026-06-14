---
description: Create a feature branch with the configured prefix
agent: build
---

Create a git branch for the current work.

The branch name: $ARGUMENTS

1. Call `git_operation` with action="branch" and the branch name.
   The configured branch prefix (e.g., "janus/") will be applied automatically.
2. Confirm the branch was created and report the full branch name.
3. If there are uncommitted changes, suggest committing them first.
