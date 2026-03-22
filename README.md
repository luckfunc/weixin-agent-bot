# weixin-agent-bot

[English](README.en.md)

微信 **iLink** + **GPT** 命令行工具：可用 **OpenAI API Key**，或 **ChatGPT / Codex 浏览器登录（OAuth，与以前一样）**；扫码绑定微信后按所选模型自动回复（支持多轮对话）。

**无需部署 OpenClaw：** 本项目是普通的 **Node 命令行**，在你本机或任意有 Node 的环境即可运行，**不必**单独搭建、托管微信 **OpenClaw** 智能体运行时；装好依赖、扫码登录，再按提示或 `.env` 配置 `OPENAI_API_KEY` / `PROVIDER=codex` 等即可。

**许可证：** MIT

## 快速开始（社区用户）

需要 **Node.js ≥ 22**。

**方式一：用 `npx`（不必全局安装）** — 每次前缀带包名；适合偶尔使用。

```bash
# 无需克隆仓库，直接跑最新已发布版本（首次运行会下载；-y 表示无需确认安装）
npx -y weixin-agent-bot@latest
```

**方式二：全局安装** — 装一次后，任意目录可直接打 `weixin-agent-bot`。

```bash
npm install -g weixin-agent-bot@latest
weixin-agent-bot
```

升级全局版本：

```bash
npm install -g weixin-agent-bot@latest
```

按终端提示操作即可。可选：在当前目录创建 `.env`（参考仓库里的 `.env.example`），以便跳过部分交互——可从 [`.env.example`](https://github.com/luckfunc/weixin-agent-bot/blob/main/.env.example) 复制。

### 常用参数（可复制命令）

下面示例**默认用 `npx`**；若已按上面 **方式二全局安装**，把命令里的 **`npx -y weixin-agent-bot@latest …`** 换成 **`weixin-agent-bot …`** 即可（参数不变）。

**`--help`** — 打印全部选项与环境变量说明：

```bash
npx -y weixin-agent-bot@latest --help
```

**`--version`** — 查看当前 CLI 版本号：

```bash
npx -y weixin-agent-bot@latest --version
```

**`--force-login`** — 忽略缓存，重新扫微信二维码登录：

```bash
npx -y weixin-agent-bot@latest --force-login
```

**`--reauth`** — 重新选择登录方式（API Key 或浏览器 OAuth）并重新鉴权：

```bash
npx -y weixin-agent-bot@latest --reauth
```

可同时带多个参数，例如既要重新扫码又要重新选模型：

```bash
npx -y weixin-agent-bot@latest --force-login --reauth
```

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
