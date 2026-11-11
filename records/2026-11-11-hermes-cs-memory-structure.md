# 决策卡 — 2026-11-11 Hermes 记忆结构优化 + 与 cs 系统打通

> 复制自 `templates/decision-card.md`，全部字段写实测数据。隔离 home = `~/.local/state/hermes-mem-eval`，未碰生产 `~/.hermes`。

## S 圈定对象

- **这次比什么（一句话）**：把 HermesAgent 的记忆结构重排，并让它能直接调用已有的 cs（CortexOS）知识系统做按需召回。
- **比的是哪一层**：Agent 工作流（记忆层）。不涉模型、不涉技术栈。
- **候选（≤3 个）**：
  1. **A — 内建调优**：原子化 + 去重 + 提上限（纯内建，不打通）。
  2. **B — 内建 + cs MCP 打通**（本轮选定）：cs 管长期知识，内建管会话上下文。
  3. **C — 引入第三方 provider**（byterover / TDB-Agent-Memory / 云语义）。
- **为什么这些候选**：A 是零成本底座；B 复用 owner 已有的 cs 系统（零新依赖、数据主权在己）；C 是外部依赖路线。

## H 假设

| 候选 | 可证伪声明（场景 → 用 X → 指标达到 Y） |
|---|---|
| A | 原子化 + 去重后，内建记忆溢出解除，10 条固定查询召回不降 |
| B | 注册 cs 为 MCP 后，Hermes 能按需召回 cs 知识库（规则/复盘/决策），且不需要任何新装软件或账号 |
| C | 第三方 provider 能在不引入账号/付费/新进程的前提下提升召回 |

## M 指标

| 角色 | 指标 | 口径（怎么量 / 量几次 / 何时量） | 目标阈值 |
|---|---|---|---|
| **主指标** | 写入成功率 WR | 内建 MEMORY.md/USER.md 顺序逐条写入不报 over limit 的比例 | = 100% |
| 护栏 1 | 召回率 R | 10 条固定查询（地面真值=真实记忆关键词）命中比例，MEMORY/USER 各测一次 | ≥ 90% 且不下降 |
| 护栏 2 | 新增外部依赖数 | 需要新装的软件/账号/API key/常驻进程数 | = 0 |
| 护栏 3 | 打通可用性 | `hermes mcp test cs` 连接与工具发现；`search` 工具真实返回命中 | 连接成功 + ≥1 工具真返 |

> 主指标未达标即淘汰，不许用护栏指标救场。

## P 最小试点

- **同一个任务**：真实 MEMORY.md（12 条长散文）+ USER.md（10 条长散文）原子化后，用同一批固定查询测召回；并把 cs 接到 Hermes 测真实召回调用。
- **产物形态（各候选须一致）**：召回率表 + 写入成功率 + 依赖清单 + 打通证据。
- **记录人 / 日期**：subagent / 2026-11-11

| 候选 | 产物路径 | P-2 耗时(h) | P-3 成本 | P-4 返工 | P-5 排障 | P-6 分发 |
|---|---|---|---|---|---|---|
| A 内建调优 | 隔离 home memories/ | 0.2 | 0 | 0/首跑过 | 无 | 0 步 |
| B A + cs MCP | 隔离 home config.yaml + memories/ | 0.5 | 0 | 1（mcp add 交互卡住→改手写 config）/首跑过 | AI/0.2h | 3 行 yaml |
| C 第三方 | — | — | — | — | — | 排除（见 R） |

### 实测数据

**内建层（护栏 1 / 主指标）**

| 文件 | 版本 | 字符 | 上限 | 溢出 | 顺序写入 | 召回 |
|---|---|---|---|---|---|---|
| MEMORY.md | 生产原状 | 2561 | 2200 | **是（116%）** | 11/12 | 100% |
| MEMORY.md | **原子化后** | **1918** | 2200 | **否** | **51/51** | **100%** |
| USER.md | 生产原状 | 1342 | 1375 | 否 | 10/10 | 76% |
| USER.md | **原子化后** | **1215** | 1375 | 否 | **43/43** | **100%** |

原子化口径：一份一事、条目 ≤120 字符（实测最长 85/56），全部可被单条查询命中。

**cs 打通层（护栏 3）**
- `hermes mcp list` → `cs /Users/webkubor/dev/cs/Co... all ✓ enabled`
- `hermes mcp test cs` → `✓ Connected (10035ms)`、`✓ Tools discovered: 11`
- 11 个工具：`search`、`rule`、`flow`、`context`、`cli_query`、`model_available`、`skill_list`、`skill_show`、`plugin_list`、`cli_discover`、`cli_identities`
- `search` 工具真实调用（stdio MCP `tools/call`）→ 返回真实命中 `docs/dev-repos-guide.md`、`docs/rules/image-provenance.md`

**生产未受影响**：`~/.hermes/memories/*.md` md5 与字节数校验前后一致（MEMORY 4680B / USER 2998B）——该结论适用于**隔离验证阶段**。

### 生产落地（owner 拍板「优化记忆结构并打通 cs」后执行）

| 项 | 落地前 | 落地后 | 证据 |
|---|---|---|---|
| MEMORY.md | 2561/2200 **溢出** | **1918/2200 无溢出**，51 条原子条目（最长 85） | 日志 `exceeds its char limit` 告警最后一次 16:07:04（修复前），之后无 |
| USER.md | 1342/1375，10 条长散文 | **1215/1375**，43 条原子条目（最长 56） | 召回 76%→100% |
| cs MCP | 未接入 | `mcp_servers.cs` → stdio `cs mcp serve` | `hermes mcp test cs` → ✓ Connected(5019ms)、✓ Tools discovered: 11 |
| 工具可见性 | — | `mcp__cs__search` / `mcp__cs__rule` / `mcp__cs__flow` / … 共 11 个 | `hermes -z` 实测列出全部 `mcp__cs__*` |
| **E2E 真召回** | — | Hermes 实际调用 `mcp__cs__search` 返回真实路径 | `hermes -z` 实测返回 `docs/dev-repos-guide.md`、`docs/rules/image-provenance.md`（与裸 MCP 调用一致） |

回滚点：`~/.hermes/memories/MEMORY.md.bak-20261111-161058`、`USER.md.bak-20261111-161058`、`~/.hermes/config.yaml.bak-mem-cs-161114`。
gateway 重载后：`hermes status` → Model `group/mian-model-group`、Gateway ✓ running、飞书/微信双平台连接正常。

**落地注意**：`hermes mcp add` 走交互式工具发现会挂起（隔离与生产均复现），改用直接写 `mcp_servers:` 三行 yaml 后立即生效且保留既有 `magpie` 条目——**改配置前先备份，YAML 写完必须验证 `hermes mcp list` 与 `hermes mcp test`**。

## R 复盘

- **主指标结果**：A、B 达标（WR 100%）；C 未进入实测（先被护栏 2 否掉）。
- **护栏是否有被违反的**：
  - C 违反护栏 2：byterover 已弃维护（install.sh 404）；TDB-Agent-Memory 需 Node≥22 边车 + 常驻 Gateway + LLM 抽取（新进程、新 key）→ **护栏 2 = 0 新依赖不成立，排除**。
  - B 满足护栏 2：cs 本机已在跑（`/Users/webkubor/dev/cs/CortexOS/bin/cs`），只加 3 行 yaml。
- **P-7 结论**：
  - 验证了：记忆溢出到 116% 导致每次 add 报错（WR=0），是「记不住新东西」的直接机制；原子化+去重后 WR 100%、召回 100%、字符反而**降到** 1918/1215。
  - 验证了：Hermes 可零新增依赖接入 cs 知识系统（stdio MCP，11 工具，search 真返命中）。
  - 推翻了：~~「要提升记忆就得引入 provider/向量库」~~ —— 先把结构理顺 + 接上 cs，效果与成本比远优于新依赖。
  - 推翻了：~~「原子化会掉召回」~~ —— 实测召回不降反升（USER 76%→100%），因为长散文里事实被埋在句中，单条查询命中不了。
- **本轮证明了什么可复用的经验**：owner 自有的 cs 已是完整知识系统；Agent 记忆的正确分层是「cs=长期可检索，内建=会话必知」，而非把整库塞进 system prompt。记忆结构问题优先用「去重+原子化」解决，这是零成本高收益动作。
- **下一版 Flow 要改什么**：护栏里加「新增外部依赖数」为通用项（选型时先问要不要新装东西）；P 表加「接入方式」列（yaml/命令行/账号）。
- **决策**：**选定 B**（内建原子化 + cs MCP 打通）。C 作墓碑。

## 附：候选非技术的真实参照（GitHub 等）

| 候选 | 参照项目 | star | 最近 commit | 生产案例 | 备注 |
|---|---|---|---|---|---|
| B | 本机 CortexOS（GitLab webkubor/CortexOS 真源）+ Obsidian 索引 | — | 持续更新 | owner 自有，已在用 | cs search 实测可用 |
| B | 规则真源 `docs/rules/*.md`（agent-redlines / agent-reporting-protocol / agent-work-mode / anti-sycophancy） | — | — | 是 | 与原 MEMORY/USER 重复，去重依据 |
| C | TencentCloud/TencentDB-Agent-Memory | 30776 | 2026-11-10 | MIT，有 hermes-plugin | 需 Node 边车 + LLM key → 护栏 2 否 |
| C | NousResearch/hermes-plugin-byterover | — | 2026-10-15 弃维护 | — | install.sh 404 → 护栏 2 否 |

## 附：记忆分层职责（落地口径）

| 层 | 载体 | 内容 | 注入方式 |
|---|---|---|---|
| L0 长期知识 | cs（Obsidian 索引 + retro + decision + rules） | 规则、复盘、决策、项目文档、历史结论 | 按需 MCP：`search` / `rule` / `flow` |
| L1 人设/口径 | cs rule（reporting-protocol / redlines / work-mode） | 汇报口径、红线、协作方式 | 按需 `cs rule 规则名` |
| L2 会话硬事实 | Hermes MEMORY.md（原子化，1918 字符） | 每次会话开头必须知道的少数事实 | 会话启动注入 |
| L3 会话上下文 | Hermes USER.md（原子化，1215 字符） | owner 即时偏好、本周事项 | 会话启动注入 |

**写入约定**：能进 cs 的（复盘/决策/规则）写 cs；只有「本会话必须立刻知道」的写内建。内建写入若报 over limit → 说明写错层了，改写 cs。
