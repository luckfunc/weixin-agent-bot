# weixin-agent-bot

[简体中文](README.zh-CN.md)

WeChat **iLink** + **LLM** CLI: pick **OpenAI API** or **ChatGPT / Codex (OAuth)**, scan QR to bind WeChat, then auto-reply with the model.

**No OpenClaw deployment:** this runs as a normal **Node CLI** on your machine (or any server with Node). You **do not** need to set up or host WeChat **OpenClaw** — just install, scan the QR code, and wire up Codex, OpenAI, or other providers via env or prompts.

**License:** MIT

## Quick start (community)

Requires **Node.js ≥ 22**.

```bash
# Run the latest release without cloning (downloads on first run)
npx weixin-agent-bot@latest
```

Then follow the prompts. Optional: create a `.env` in the current directory (see `.env.example` in the repo) so the CLI can skip questions — copy from [`.env.example`](https://github.com/luckfunc/weixin-agent-bot/blob/main/.env.example).

**Flags:** `--help`, `--version`, `--force-login` (WeChat QR again), `--reauth` (re-select and re-authenticate the LLM provider).

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
