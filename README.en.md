# weixin-agent-bot

[简体中文](README.md)

WeChat **iLink** + **GPT** CLI: use an **OpenAI API key** *or* **ChatGPT / Codex browser OAuth** (same style as before). Scan QR to bind WeChat, then auto-reply with your chosen model (multi-turn per user).

**No OpenClaw deployment:** this runs as a normal **Node CLI** on your machine (or any server with Node). You **do not** need to set up or host WeChat **OpenClaw** — configure `OPENAI_API_KEY` and/or `PROVIDER=codex` via `.env` or prompts.

**License:** MIT

## Quick start (community)

Requires **Node.js ≥ 22**.

**Option A: `npx` (no global install)** — type the package name each time; good for occasional use.

```bash
# Run the latest release without cloning (downloads on first run; -y skips install prompt)
npx -y weixin-agent-bot@latest
```

**Option B: global install** — install once, then run `weixin-agent-bot` from any directory.

```bash
npm install -g weixin-agent-bot@latest
weixin-agent-bot
```

Upgrade the global install:

```bash
npm install -g weixin-agent-bot@latest
```

Then follow the prompts. Optional: create a `.env` in the current directory (see `.env.example` in the repo) so the CLI can skip questions — copy from [`.env.example`](https://github.com/luckfunc/weixin-agent-bot/blob/main/.env.example).

### Common flags (copy-paste)

Examples below use **`npx`**. If you used **Option B**, replace **`npx -y weixin-agent-bot@latest …`** with **`weixin-agent-bot …`** (same flags).

**`--help`** — print all options and environment variables:

```bash
npx -y weixin-agent-bot@latest --help
```

**`--version`** — print the CLI version:

```bash
npx -y weixin-agent-bot@latest --version
```

**`--force-login`** — ignore cached session and show the WeChat QR login again:

```bash
npx -y weixin-agent-bot@latest --force-login
```

**`--reauth`** — pick sign-in method again (API key vs browser OAuth) and re-authenticate:

```bash
npx -y weixin-agent-bot@latest --reauth
```

You can combine flags, e.g. fresh WeChat login and OpenAI re-auth:

```bash
npx -y weixin-agent-bot@latest --force-login --reauth
```

## Develop from source

```bash
git clone https://github.com/luckfunc/weixin-agent-bot.git
cd weixin-agent-bot
npm install
npm run dev
# or: npm run build && node dist/cli.js
```

## WeChat SDK

Uses [`@pinixai/weixin-bot`](https://www.npmjs.com/package/@pinixai/weixin-bot) (sources: **[epiral/weixin-bot](https://github.com/epiral/weixin-bot)**). `postinstall` runs a local build of that package because the npm tarball ships TypeScript only.

## Thanks

**[weixin-bot](https://github.com/epiral/weixin-bot)** by [@epiral](https://github.com/epiral) — thank you for the Node.js SDK and protocol work.
