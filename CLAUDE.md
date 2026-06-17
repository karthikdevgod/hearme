# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

HearMe is a voice-first AI conversation companion — a personal reflection and emotional-support companion. It is **not** an AI girlfriend/boyfriend, dating app, or therapy replacement. Keep product copy, prompts, and features aligned with that framing.

## Commands

Run from the repo root (pnpm + Turborepo workspace):

```bash
pnpm install
pnpm dev                 # web (:3000) + api (:4000) in watch mode
pnpm dev:web             # web only
pnpm dev:api             # api only
pnpm emulators           # Firebase Auth/Firestore/Storage emulators (separate shell, run before dev)
pnpm build               # build all packages (respects dependency graph)
pnpm lint                # eslint across workspace
pnpm typecheck           # tsc --noEmit across workspace
pnpm test                # all tests
pnpm format              # prettier --write
```

Per-package: `pnpm --filter @hearme/api test`, `pnpm --filter @hearme/web typecheck`, etc.

Running a single API test: `pnpm --filter @hearme/api exec jest <pattern>` (Jest + ts-jest). The web app has no tests yet (`test` is a no-op). The `@hearme/shared` and `@hearme/config` packages have no lint configured (their `lint` scripts are stubs).

**Build order matters:** `@hearme/shared` and `@hearme/config` compile to `dist/` and are consumed as `workspace:*` deps. Turbo's `^build` dependsOn handles this, but if you see stale types in web/api, rebuild the changed package (`pnpm --filter @hearme/shared build`). `dev` tasks also depend on `^build`, so the shared packages must build before the apps start.

## Architecture

Monorepo: two apps over two shared packages.

- `apps/web` — **Next.js 15** (App Router, React 19, Turbopack). Two surfaces in one app:
  - **Marketing** under `src/app/[locale]/` — SSG/ISR, localized via `next-intl`, SEO-heavy (sitemap, robots, JsonLd, hreflang).
  - **Authed app** under `src/app/(app)/` (dashboard, conversation, onboarding) and `(auth)` — client-rendered, Firebase-auth gated, **not** localized.
  - `src/middleware.ts` runs `next-intl` routing on marketing routes **only**; its matcher explicitly excludes the app/auth/admin routes. When you add a new authed top-level route, add it to that exclusion list or it will get locale-prefixed.
- `apps/api` — **NestJS 11**. Feature modules under `src/modules/*` (voice, conversations, memory, reports, billing, users, onboarding, dashboard, admin, analytics, auth, health). External integrations are isolated under `src/infrastructure/*` (firebase, openai, anthropic, elevenlabs, stripe) and imported as global modules.
- `packages/config` — **single source of truth for env**. Zod schemas with three entrypoints: `@hearme/config` (server, `loadServerEnv`), `@hearme/config/public` (`loadPublicEnv`, NEXT_PUBLIC_* only, safe for client), `@hearme/config/server`. Never import the server schema into client components — it carries secrets.
- `packages/shared` — TS types, Zod schemas, and DTOs shared by web + api (`domain.ts` = entities, `ws-protocol.ts`, `constants.ts`, `dashboard.ts`). The canonical data contracts live here.

### Voice pipeline (important: turn-based, not streaming)

Each turn is push-to-talk over **HTTP multipart**, orchestrated in `apps/api/src/modules/voice/voice.service.ts`:

`mic → POST /voice/conversations/:id/turn (audio blob) → STT → load history+memory, buildSystemPrompt → LLM chat → ElevenLabs TTS → base64 audio back`

Endpoints: `POST /voice/conversations` (start, pre-flights daily free-minute budget), `POST /voice/conversations/:id/turn`, `POST /voice/conversations/:id/end`. The web client uses `apiUpload`/`apiFetch` in `src/lib/api.ts`.

`packages/shared/src/ws-protocol.ts` defines a WebSocket streaming protocol, and the README describes the pipeline as "streaming." **That WS path is not wired up** — there is no `WebSocketGateway` in the API and no WS client in web. Treat the current implementation as the turn-based HTTP one; the WS protocol is aspirational/future.

### Provider swappability + cost metering

STT and LLM providers are swappable via env (`STT_PROVIDER` = openai|elevenlabs, `LLM_PROVIDER` = openai|anthropic) with no code changes — both implementations live behind the infrastructure services. Every turn records per-component cost (`sttCost`/`llmCost`/`ttsCost`/`totalCost`) on the conversation, which drives admin profitability/dashboard views. When touching the voice path, keep cost metering intact and add the unit-cost env knobs (e.g. `*_COST_PER_*` in `config/server.ts`) for any new provider.

### Auth

- Web: Firebase client SDK. `src/lib/auth.tsx` exposes `useAuth()`; `getIdToken()` feeds the bearer token into every API call (`src/lib/api.ts`).
- API: `FirebaseAuthGuard` (`src/common/guards/firebase-auth.guard.ts`) verifies `Authorization: Bearer <Firebase ID token>` and attaches `req.user`. Read it in controllers via the `@CurrentUser()` decorator. Apply with `@UseGuards(FirebaseAuthGuard)`.

### Config / env conventions

- Env is validated **once at boot** through the shared Zod schema (`ConfigModule` provides the typed `ServerEnv` under the `ENV` token; inject with `@Inject(ENV)`). `apps/api/src/load-env.ts` MUST be the first import in `main.ts` because `app.module.ts` reads env at import time. It walks up to find the monorepo-root `.env`.
- The root `.env` is the single env file for the whole monorepo. `next.config.mjs` and `turbo.json` both load it; Next inlines `NEXT_PUBLIC_*` at build time (referenced statically via `apps/web/src/env.ts`).
- Feature flags, pricing/plan numbers, free-tier minutes, supported languages, and retention are all env-driven (see `packages/config/src/server.ts`). Prefer adding a flag/number there over hardcoding.

## Deployment

- **Web → Netlify** (`netlify.toml`): `base = apps/web`, `@netlify/plugin-nextjs` runtime, Node 22. Build command is `pnpm run build` — never run the dev server in CI (it never exits).
- **API → Render** (`apps/api/render.yaml`, `apps/api/Dockerfile`). `docker-compose.yml` is for local API-against-emulators parity only.
- Firebase rules/indexes live in `firebase/` (`firestore.rules`, `firestore.indexes.json`, `storage.rules`); `.firebaserc` default project is `hearme-companion`, but the local emulator project is `hearme-local`.

## Conventions

- TypeScript strict mode repo-wide with `noUncheckedIndexedAccess` (`tsconfig.base.json`) — index access yields `T | undefined`; handle it.
- Validate inputs with Zod schemas from `@hearme/shared` (the API deliberately has **no** global `ValidationPipe`; validation is per-route with Zod — see `main.ts`).
- Prettier enforced (`.prettierrc.json`); run `pnpm format` before committing.
- When a type or DTO crosses the web/api boundary, define it in `packages/shared` rather than duplicating.
