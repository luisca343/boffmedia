---
description: Scaffold janus workspace and detect project structure
agent: build
---

Initialize the janus SDD workspace for this project.

Run the following steps:

1. Run `janus init --agent opencode` to scaffold the .janus/ directory, detect verification stages from package.json, and generate agent configs.

2. Run `janus doctor` to validate the workspace — check config, environment, and connectivity.

3. Read the generated `.janus/config.json` and `.janus/constitution.md`. Report what was created and suggest what the user should customize.

4. If the project has a package.json, summarize the detected verification stages.

Report the full status of the initialized workspace.
