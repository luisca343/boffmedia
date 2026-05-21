---
applyTo: "**"
---
## Repository Layout

```
/
├── apps/
│   ├── web/          # Next.js client (port 3000)
│   │   └── src/
│   │       ├── app/                    # App Router routes
│   │       │   ├── (boffmedia)/        # Boffmedia section
│   │       │   │   ├── (eventos)/      # Events
│   │       │   │   └── (herramientas)/ # Gaming tools (baseline design system)
│   │       │   └── smartrotom/         # SmartRotom cellphone UI
│   │       ├── services/
│   │       │   ├── api/boffmedia/      # Boffmedia API calls
│   │       │   ├── api/smartrotom/     # SmartRotom API calls
│   │       │   ├── api/tools/          # Tool-specific API calls
│   │       │   └── mcef/               # Minecraft MCEF integration
│   │       ├── components/
│   │       │   ├── ui/primitives/      # shadcn/Radix primitives (no business logic)
│   │       │   ├── boffmedia/          # Boffmedia domain components
│   │       │   ├── smartrotom/         # SmartRotom components (own design system)
│   │       │   └── shared/pokemon/     # Shared Pokémon UI (TypeBadge, etc.)
│   │       └── features/ficusai/       # FicusAI chat feature slice
│   └── api/          # NestJS server (port 34301)
│       └── src/
│           ├── api/boffmedia/          # Boffmedia endpoints
│           ├── api/smartrotom/         # SmartRotom endpoints
│           ├── discord/                # Discord bot
│           ├── _db/schema/             # Drizzle schema definitions
│           └── _repositories/          # Data access layer
└── packages/
    └── shared/src/models/  # AUTO-GENERATED — do not edit (255+ OpenAPI models)
```
