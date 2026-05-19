# Environment Variable Refactor Plan

## Goal

Refactor both the API and WEB applications to stop using direct `process.env.*` calls scattered across the codebase.

The new architecture must introduce a centralized and validated environment configuration layer for each application independently.

Current Docker setup and `.env` file placement are already correct and **must not be modified**.

---

# Existing Setup

Current structure:

```txt
api/
  .env

web/
  .env
```

Each application already runs in its own Docker container and mounts its own `.env` separately.

Do NOT:
- change Docker configuration
- move `.env` files
- create a shared `.env`
- expose API secrets to the frontend

---

# Required Refactor

## 1. Create centralized env loaders

Create:

```txt
api/src/config/env.ts
web/src/config/env.ts
```

Each file must:
- read environment variables
- validate them
- export a typed `env` object
- fail immediately on startup if variables are invalid

Use `zod` for validation.

---

# API Example

Create:

```ts
// api/src/config/env.ts

import { z } from "zod";

export const env = z
  .object({
    NODE_ENV: z.enum(["development", "production", "test"]),

    PORT: z.coerce.number().default(3000),

    DATABASE_URL: z.string(),

    JWT_SECRET: z.string().min(32),
  })
  .parse(process.env);
```

---

# WEB Example

Adjust according to framework conventions.

Examples:
- Next.js => `NEXT_PUBLIC_*`
- Vite => `VITE_*`

Example:

```ts
// web/src/config/env.ts

import { z } from "zod";

export const env = z
  .object({
    NEXT_PUBLIC_API_URL: z.string().url(),
  })
  .parse(process.env);
```

---

# 2. Search and replace all direct env access

Search the entire repository for:

```ts
process.env
```

and replace every direct usage with imports from the centralized env loader.

Example:

BEFORE:

```ts
process.env.DATABASE_URL
```

AFTER:

```ts
import { env } from "@/config/env";

env.DATABASE_URL
```

Apply this across:
- API
- WEB
- services
- utilities
- middleware
- auth
- DB config
- feature modules
- tests if applicable

---

# 3. Rules

## Mandatory

- No remaining direct `process.env.*` access outside env loader files
- Keep one env loader per application
- Preserve separation between API and WEB environments
- Keep secrets server-side only
- Use typed access everywhere
- Validation must happen at startup

## Do NOT

- Create one shared global env object for both apps
- Put frontend-safe and backend-secret variables together
- Modify Docker configuration
- Modify `.env` locations
- Introduce runtime mutable config state

---

# 4. Add `.env.example`

Ensure both apps contain:

```txt
api/.env.example
web/.env.example
```

These files must:
- contain all required variables
- exclude real secrets
- include placeholder/example values

---

# 5. Install dependencies

If missing, install:

```bash
npm install zod
```

or equivalent package manager command.

---

# 6. Final validation

After refactor:

- run typecheck
- run tests
- run lint
- verify both containers boot correctly
- verify startup fails when required env vars are missing
- verify frontend builds correctly
- verify no server secrets are exposed to browser bundles

---

# Expected Result

Final architecture should resemble:

```txt
api/
  src/
    config/
      env.ts

web/
  src/
    config/
      env.ts
```

with all application code importing from:

```ts
import { env } from "@/config/env";
```

instead of using direct `process.env.*` access.
