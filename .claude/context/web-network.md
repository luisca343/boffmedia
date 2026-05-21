## Web Network Rules (Pragmatic)

- Preferred path for backend HTTP calls is `apps/web/src/services/api/`.
- Existing wrappers in `apps/web/src/services/boffAPI.ts` and `apps/web/src/services/wingullApi.ts` are valid in this repository and are not deprecated.
- Route-local SmartRotom `_services/` are allowed when the integration is route-scoped or external-platform specific.

## Direct Fetch Policy

- By default, do not introduce new direct `fetch` calls in pages/components/hooks for backend API requests.
- Prefer service-layer functions (`services/api`, or existing valid wrappers) for backend communication.
- Direct `fetch` is allowed for explicit exception cases, such as:
  - External OAuth/provider APIs
  - External media/asset probes (for example `HEAD` checks)
  - Framework/session endpoints that are not part of NestJS domain APIs
- When using an exception, keep the call localized and document intent with a brief comment if not obvious.
