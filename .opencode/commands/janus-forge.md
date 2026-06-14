---
description: Create MR/issue on GitHub or GitLab
agent: build
---

Create a merge/pull request or issue.

The user wants to: $ARGUMENTS

Determine the action:
- If creating an MR/PR: call `forge_create_mr` with the spec ID and description
- If creating an issue: call `forge_create_issue` with title and description
- If checking pipeline status: call `forge_pipeline_status`

Report the result (URL, status, etc.).
