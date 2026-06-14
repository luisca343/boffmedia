# Guidelines

Domain-scoped rules loaded into task context **only when the task touches matching files**.

Each guideline is a markdown file with YAML frontmatter:

```markdown
---
description: NestJS API standards
applyTo: "apps/api/**/*.ts"
---

- Every endpoint declares a typed DTO with class-validator decorators.
- ...
```

`applyTo` accepts a glob or list of globs, matched against the `files:` hints of the
task being started. Guidelines without `applyTo` are always included.
