# TODO：带记忆的持续会话（多轮聊天）

## 目标

让机器人在微信里**能联系上下文**回复，而不是每条消息都当成「只有一句的新对话」。  
当前实现见下文「现状」；本文件先讲**原理**，再列**下一步要做的事**。

---

## 原理：带记忆的会话是怎么工作的

### 1. 模型本身没有「会话」概念

大模型 API 大多是 **无状态** 的：每次请求你只传一坨 **messages**（system + 多轮 user/assistant/tool…）。  
**不会**因为你用同一个微信账号，服务端就自动帮你记着昨天聊了什么——除非**你的程序**每次把历史拼进请求里，或用厂商提供的「会话 id / thread」类能力（本仓库目前没用后者）。

所以：**记忆 = 你在应用里维护的一段对话历史，并在每次调用模型时带上去。**

### 2. 最小数据结构：按「会话」存消息列表

对微信机器人来说，通常用 **`userId`（或 session_id）** 区分「和谁聊」：

- 每个 peer 一条**消息列表**，按时间顺序：`[user, assistant, user, assistant, …]`
- 收到新的一条用户消息时：
  1. 把用户话追加进列表；
  2. 调模型时把 **列表里最近若干轮**（或截断后的全文）塞进 `messages`；
  3. 拿到助手回复后，再把 assistant 内容追加进列表。

这样模型在**本次请求**里能看到**前几轮说了什么**，就能「接着聊」。

### 3. 为什么要截断（滑动窗口 / 摘要）

- **上下文长度有限**：模型有 max context，token 要钱。
- 常见做法：
  - **滑动窗口**：只保留最近 **N 轮**（例如 10 轮）或最近 **M 个 token** 的估算；
  - **摘要**：把更早的对话压成一段 summary，放在 system 或第一条 user 前（实现成本高一些）。

### 4. 和「桌面工具 / Codex」的关系

- **纯文本多轮**：history 就是 user/assistant 文本对，发给 `completeSimple` 或 Chat Completions 的 `messages`。
- **带 `run_shell` 的多轮**：若中间有 tool 调用，完整上下文里还要包含 **assistant tool_calls + tool 结果**，否则下一轮模型会断档。  
  实现记忆时要么：
  - 只记「最终给用户看的」assistant 文本（简单但工具细节丢失），或  
  - 按 API 要求记**完整** message 链（更正确，实现更复杂）。

### 5. 生命周期与持久化

| 策略 | 说明 |
|------|------|
| 仅内存 | 进程重启后失忆；实现简单。 |
| 落盘（JSON/SQLite） | 重启后仍可续聊；需考虑路径、并发、隐私。 |

微信侧 **context_token** 只用于**发消息路由**，不是「模型记忆」；**模型记忆要自建**。

### 6. 与本项目当前行为的对照

当前每条消息只传**单条 user**，没有历史 → **无法持续上下文**。  
要变成持续聊天机器人，必须在 `weixin-runner` / `reply` 之间加一层 **Session 存储 + 组装 messages**。

---

## 现状（代码层面）

- `src/bot/weixin-runner.ts`：每次只传 `userText: msg.text`。
- `src/llm/reply.ts`：Codex / OpenAI 兼容路径的 `messages` 均只有当前一句 user（及 system）。

---

## 下一步 TODO（实现 checklist）

- [ ] **定会话键**：例如 `msg.userId`（或 `WeixinBot` 提供的稳定 id），确保单聊不串号。
- [ ] **选存储**：内存 Map（开发）→ 可选 `WEIXIN_SESSION_PATH` 写 JSON/SQLite（生产）。
- [ ] **定保留策略**：最大轮数或最大字符/token 估算，超出则丢弃最旧或做摘要（摘要可后置）。
- [ ] **改 `replyText` 签名**：传入 `history: Message[]` 或 `sessionId` + 内部加载历史；返回时同时返回「要追加的 assistant 消息」以便写回存储。
- [ ] **Codex 路径**：`completeSimple` 的 `messages` 使用「system + 历史 + 当前 user」；注意 pi-ai 的 `Message` 类型与时间戳。
- [ ] **OpenAI 兼容路径**：`messages` 数组带上历史 role/user/assistant。
- [ ] **桌面工具模式**（`WEIXIN_DESKTOP_TOOLS=1`）：决定是否持久化 tool 轮次；若持久化，需存 tool 相关 message，与 `reply-agent` 循环对齐。
- [ ] **并发**：同一用户快速连发时是否串行处理（可用现有 `serial-task` 思路按 user 维度加锁）。
- [ ] **配置**：如 `WEIXIN_SESSION_MAX_TURNS`、`WEIXIN_SESSION_PERSIST=1` 等，并更新 `.env.example`。
- [ ] **文档**：在 `docs/desktop-tools-principle.md` 或 README 加一小节「多轮记忆」说明。

---

## 参考阅读顺序

1. 本文（原理 + TODO）
2. `docs/desktop-tools-principle.md`（微信 / Codex / 工具分层）
3. `@mariozechner/pi-ai` 的 `Context.messages` / `Message` 类型定义
