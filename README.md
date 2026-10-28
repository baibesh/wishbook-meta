# WishBook

A personalized picture book where your child is the hero. A parent tells us the child's name, age,
interests, pet and city; WishBook writes the story and illustrates every page with the same child,
then the book is printed and delivered in Kazakhstan.

Built for the Meta Global AI Developer Hackathon (Indie track, "Build for Your World").

## How WishBook uses Meta models

| Step | Model | What it does |
| --- | --- | --- |
| Story | Muse Spark (`muse-spark-1.3`) | Writes the book in Russian or Kazakh as strict JSON: title, a hero description, and per page the text and a scene prompt. Invalid JSON is retried with the validation error. |
| Hero | Muse Image (`muse-image-1.0`) | Draws a character sheet of the child on a white background. |
| Pages | Muse Image | Every page chains from the hero sheet with `previous_response_id`, so the child stays the same on every page. Pages render in parallel. |

All model calls live in `apps/api/src/meta/`. `MODELS=mock` swaps them for canned output, so tests and
CI never call the API.

## Stack

- `apps/web`: Next.js 16, Tailwind 4, TanStack Query, react-hook-form + zod, lucide-react
- `apps/api`: NestJS 11, Prisma + Postgres, OpenAI SDK pointed at `https://api.meta.ai/v1`
- `packages/shared`: zod schemas and types shared by web and API
- `e2e`: [tapstep](https://tapstep.dev) flows: UI, HTTP and SQL checks in one YAML

## Run locally

Needs Node 22+, pnpm and Postgres.

```bash
pnpm install
createdb wishbook_meta
cp apps/api/.env.example apps/api/.env   # set DATABASE_URL; MODELS=meta + MODEL_API_KEY for real models
pnpm --filter @wishbook/api exec prisma db push
pnpm dev                                  # web :3000, api :4000
```

## Tests

```bash
pnpm typecheck && pnpm lint && pnpm test   # unit tests
createdb wishbook_meta_e2e && cp e2e/.env.example e2e/.env
pnpm build && DATABASE_URL=… ./e2e/start-stack.sh
tapstep test e2e/flows --config e2e/config.yaml
```

CI (GitHub Actions) runs the same: typecheck, lint, unit tests and `tapstep validate`, then the E2E
flows against a Postgres service with mock models.
