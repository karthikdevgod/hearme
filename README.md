# HearMe

> A safe space to talk, reflect, and feel heard.

HearMe is a voice-first AI conversation companion — a personal reflection and emotional-support companion. It is **not** an AI girlfriend/boyfriend, dating app, or therapy replacement.

## Monorepo layout

```
apps/
  web/        Next.js 15 — marketing (SSG/ISR, SEO) + authed app (CSR)
  api/        NestJS — voice orchestration, AI, billing, webhooks
packages/
  config/     env schema + parsing (Zod) — single source of truth
  shared/     TS types, DTOs, Zod schemas shared by web + api
  ui/         shared ShadCN components
firebase/     Firestore/Storage rules + indexes
```

## Quick start

```bash
pnpm install
cp .env.example .env        # fill in keys
pnpm emulators              # Firebase Auth/Firestore/Storage emulators (separate shell)
pnpm dev                    # runs web (:3000) + api (:4000)
```

## Architecture

Voice pipeline (streaming, manual): `mic → WS → NestJS → STT → memory+prompt → OpenAI → ElevenLabs → audio`. Per-component cost metering (`sttCost`/`llmCost`/`ttsCost`) drives admin profitability.

See the build plan for phasing, data model, and SEO strategy.

## Scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Run web + api in watch mode |
| `pnpm build` | Build all packages |
| `pnpm lint` / `pnpm typecheck` / `pnpm test` | Quality gates |
| `pnpm emulators` | Start Firebase emulators |
