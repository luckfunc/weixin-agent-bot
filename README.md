# weixin-agent-bot

[English](README.en.md)

微信 **iLink** + **大模型** 命令行工具：可选 **OpenAI**、**DeepSeek**、**Kimi (Moonshot)**、**ChatGPT / Codex（OAuth）** 等，扫码绑定微信后，用所选模型自动回复消息。

**无需部署 OpenClaw：** 本项目是普通的 **Node 命令行**，在你本机或任意有 Node 的环境即可运行，**不必**单独搭建、托管微信 **OpenClaw** 智能体运行时；装好依赖、扫码登录，再按提示或 `.env` 配置 Codex、OpenAI 等即可。

**许可证：** MIT

## 快速开始（社区用户）

需要 **Node.js ≥ 22**。

```bash
# 无需克隆仓库，直接跑最新已发布版本（首次运行会下载；-y 表示无需确认安装）
npx -y weixin-agent-bot@latest
```

按终端提示操作即可。可选：在当前目录创建 `.env`（参考仓库里的 `.env.example`），以便跳过部分交互——可从 [`.env.example`](https://github.com/luckfunc/weixin-agent-bot/blob/main/.env.example) 复制。

**常用参数：** `--help`、`--version`、`--force-login`（重新扫微信二维码登录）、`--reauth`（重新选择并登录大模型服务商，含 Codex OAuth）。

## 从源码开发

```bash
git clone https://github.com/luckfunc/weixin-agent-bot.git
cd weixin-agent-bot
npm install
npm run dev
# 或：npm run build && node dist/cli.js
```

## 微信 SDK

使用 [`@pinixai/weixin-bot`](https://www.npmjs.com/package/@pinixai/weixin-bot)（源码：**[epiral/weixin-bot](https://github.com/epiral/weixin-bot)**）。`postinstall` 会在本地编译该依赖，因为 npm 包内仅有 TypeScript 源码。

## 致谢

**[weixin-bot](https://github.com/epiral/weixin-bot)**（作者 [@epiral](https://github.com/epiral)）——感谢提供的 Node.js SDK 与协议相关工作。
