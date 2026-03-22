# weixin-agent-bot

WeChat iLink + LLM scaffold. Run `npx weixin-agent-bot` after `npm run build` (or `npm run dev` during development).

## WeChat SDK

Uses [`@pinixai/weixin-bot`](https://www.npmjs.com/package/@pinixai/weixin-bot) (published from the same sources as **[epiral/weixin-bot](https://github.com/epiral/weixin-bot)**). `postinstall` builds the package because the npm tarball ships TypeScript only.

## Thanks

The WeChat transport layer comes from **[weixin-bot](https://github.com/epiral/weixin-bot)** by **[@epiral](https://github.com/epiral)** — thank you for the excellent Node.js SDK and protocol work.
