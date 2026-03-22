# Repository Guidelines

## Project Structure & Module Organization
- `src/cli.ts` is the CLI entry that wires prompts, environment resolution, and the bot runner.
- Feature code lives under `src/{auth,bot,llm,providers,lib}`; place shared utilities in `src/lib`.
- Built artifacts land in `dist/`, tests live under `test/`, helper tooling resides in `scripts/`, and configuration lives at the root (`package.json`, `tsconfig.json`, `.env.example`, `LICENSE`).

## Build, Test, and Development Commands
- `npm run dev` launches `tsx src/cli.ts` for interactive development without writing output.
- `npm run build` runs `tsc` to emit `dist/cli.js`, matching the published `weixin-agent-bot` binary.
- `npm run test` executes `tsx --test test/**/*.test.ts`, covering provider-env, secret-file, and serial-task flows without separate compilation.
- `npm run lint` runs `tsc --noEmit` as a strict type check and should precede merges.
- `npm run postinstall` builds `@pinixai/weixin-bot` from `scripts/postinstall-weixin-bot.mjs`; rerun only when SDK or environment changes require it.

## Coding Style & Naming Conventions
- The project targets Node ≥22 with `moduleResolution: NodeNext`, so prefer ES module imports/exports and respect `type: module`.
- Use two-space indentation, single quotes, and minimal semicolons; `tsc` is configured with `strict`, `esModuleInterop`, `declaration`, and `sourceMap`.
- Favor camelCase for locals/functions, PascalCase for exports, and lowercase/hyphenated file names for multiword modules.
- Keep CLI orchestration inside `src/cli.ts`, delegate provider handling to `src/providers`, and place shared bot/LLM sequences in `src/bot` or `src/llm`.

## Testing Guidelines
- Tests live in `test/*.test.ts`; `tsx --test` executes them in TypeScript without extra builds.
- Reuse `test/helpers.ts` for fixtures, keeping each test focused on a single CLI flow.
- After modifying providers or connection logic, rerun `npm run test` (or `npm run test -- provider-env.test.ts`) to ensure regressions are caught promptly.

## npm publish & versioning
- The npm registry **rejects** `npm publish` if that **exact** `version` in `package.json` is already published (`E409` / “cannot publish over previously published version”). A failed publish often means the version was not bumped.
- **Any change that will be published to npm** must include a **new semver** in `package.json` (and a matching root `package.json` entry in `package-lock.json`, e.g. run `npm install --package-lock-only` after editing the version). Use `chore: bump version to x.y.z` in the same release flow when appropriate.
- Pure docs-only or repo-only commits that **do not** go to npm do not require a version bump—but as soon as you cut a release, bump first, then publish.
- `prepublishOnly` runs `npm run build`; still verify `npm run lint` / `npm test` before publishing.

## Commit & Pull Request Guidelines
- Follow conventional commit prefixes (e.g., `fix(cli):`, `feat(bot):`, `docs:`, `chore:`) as seen in history.
- PR descriptions should summarize the change, list commands you ran (build/test/lint), and link related issues or discussions.
- Attach logs or screenshots only if the CLI behavior changes visibly or an error flow is being documented.

## Security & Configuration Tips
- Copy `.env.example` to `.env` for local runs; avoid checking secrets into Git. The CLI respects `PROVIDER`, `OPENAI_API_KEY`, `MODEL`, `SYSTEM_PROMPT`, and cached session indicators unless `--force-login`/`--reauth` is used.
- Keep `npm install`/`npm run postinstall` in sync so the bundled `@pinixai/weixin-bot` code stays in lockstep with the TypeScript source expected by this repo.
