# 决策卡 — 2026-11-11 Hermes 记忆层优化

> 复制自 `templates/decision-card.md`，全部字段写实测数据，无占位符。数据源：用户真实 MEMORY.md + 隔离 home 实测（未碰生产 ~/.hermes）。

## S 圈定对象

- **这次比什么（一句话）**：为 HermesAgent 选一个「能真正记住、且 6 个月不写代码的人能维护」的记忆层方案。
- **比的是哪一层**：Agent 工作流（记忆层）。模型 / 技术栈不混入。
- **候选（≤3 个）**：
  1. **A — built-in 调优**（原子化条目 + 维持/提高字符上限，零成本）
  2. **B — byterover**（官方曾 bundled 的本地优先知识树，brv CLI）
  3. **C — 云语义 provider**（mem0 / supermemory / hindsight / retaindb / openviking 一类，需账号/API key/通常付费）
- **为什么这些候选**：先零成本救活写满的内建（A）；B 是唯一本地优先免费的官方 tier 代表；C 代表「召回增强但要云账号/付费」大类。社区 tier（factledger/mem-os，0 star，非官方）只做旁证不入候选。

## H 假设

| 候选 | 可证伪声明（场景 → 用 X → 指标达到 Y） |
|---|---|
| A | 在「新事实写入 + 跨会话召回」下，把长散文条目原子化并维持在限内，能让写入成功率从 0%（当前溢出）回到 ≈100% 且召回不降 |
| B | 换成 ByteRover(brv) 后，在同任务集下召回不低于内建，且其安装是「一条命令、上游活跃」 |
| C | 换云语义 provider 后召回显著高于 A/B，但对单人/无代码 owner 成本与分发摩擦可接受 |

## M 指标

| 角色 | 指标 | 口径（怎么量 / 量几次 / 何时量） | 目标阈值 |
|---|---|---|---|
| **主指标** | 写入成功率 WR | 溢出下每次 memory add 是否报错；真实 MEMORY.md 当前 2561 字符 > 2200 | = 100% |
| 护栏 1 | 召回率 R | 10 条固定查询（地面真值=真实记忆关键词）在注入块中被命中比例 | ≥ 80% |
| 护栏 2 | 分发摩擦 P-6 | 安装步数；是否需云账号/API key/付费；无代码 owner 可否自维护（measured） | ≤ 3 步 / 免账号免付费或 1 账号 |
| 护栏 3 | 上游维护 | 候选最近 release；是否有「弃维护」标志（本轮已查） | 6 个月内更新 |

> 主指标未达标即淘汰，不许用护栏指标救场。

## P 最小试点

- **同一个任务**：从真实 MEMORY.md 的 12 条长散文条目出发，测「能写入多少 + 10 固定查询召回多少」；各候选同 10 查询。隔离 home = `~/.local/state/hermes-mem-eval`，未碰生产 `~/.hermes`。
- **产物形态（各候选须一致）**：同 10 查询召回表 + 写成功率 + 安装摩擦。
- **记录人 / 日期**：subagent / 记忆评估接力 / 2026-11-11

| 候选 | 产物路径 | P-2 耗时(h) | P-3 成本(元/token) | P-4 返工(轮次/首跑通过) | P-5 排障(谁修/h) | P-6 分发(步数/体积) |
|---|---|---|---|---|---|---|
| A 内建调优 | 见 R（内存模拟） | 0.2 | 0 | 0/首跑过 | 无/0 | 0 步；(仅改 MEMORY.md + 可选 config) |
| B byterover | 隔离 home 实测 brv status | ~2min 安装 (npm) | 本地免费 / 云付费 | 1 次（需设 PATH） | 需 owner 或 AI/0.2h | 2 步：npm 装 CLI + PATH；install.sh 已 404；643 子包 552 实装；API key 可选 |
| C 云语义 | 未装（不满足护栏 2/3） | — | 需账号/API key/通常付费 | — | — | ≥3 步 + 账号付费 |

### 写实测（真实数据，内存模拟 same-WR-gate）

当前生产态：`MEMORY.md = 2561 字符 / 2200 限 = 溢出 361` → **每次 memory add 报错，WR = 0%**。

| 配置 | 溢出 | 末字符 | 收进/总数 | 召回 R |
|---|---|---|---|---|
| A0 现状 2200 长散文 | True | 2200 | 11/12 | 90% |
| B0 原子事实 2200 | True | 2186 | 36/40 | 90% |
| C0 原子事实 4600 | False | 2513 | 40/40 | 90% |

> C0 结论：原子化 + 适当提上限（4600）→ **WR=100%（40/40 全收进）+ R=90% 不掉**，且无任何安装/账号/付费。

## R 复盘

- **主指标结果**：A 达标（WR 0%→100% 唯一无摩擦路线）；B 的护栏 3「上游维护」被违反；C 未满足护栏 2/3。
- **护栏是否有被违反的**：
  - B「上游维护」✗：byterover 已于 **2026-10-15** 被从 Hermes core 移除，转 standalone 且标 **「Unmaintained — looking for an owner」**；其官网 `install.sh` 实测 **404**（npm 包 3.16.1 仍可装，但重 643 子包/552 实装，且需额外 PATH 排障）。
  - C「分发摩擦 / 维护」✗：云 provider 需账号 + API key + 通常付费，不符合近 6 个月不写代码单人成本。
- **P-7 结论**：
  - 验证了：memory 溢出到 116% → 每次写报错，这是「记不住新东西」的直接机制；A 原子化+限内即可恢复 100% 写入且召回不掉。
  - 推翻了：~~ByteRover 免费且活跃维护~~（上游已弃）；~~超限只是丢容纳不下的~~（实际整次 add 报错）；~~换 provider 是唯一出路~~（零成本内建调优即可先救活）。
- **本轮证明了什么可复用的经验**：6 个月不写代码，选记忆先看「安装几步、要不要账号/付费、上游还活不活」再看召回；本地免费里**内建原子化**是最低摩擦解。
- **下一版 Flow 要改什么**：P 表补「上游维护」独立成一列；M 护栏里「分发摩擦」应含「是否踩 404/需 PATH/子包体量」这类可复现安装坑。
- **决策**：**本卡结论已被 [cs 打通卡](./2026-11-11-hermes-cs-memory-structure.md) 取代**。
  - A 内建调优 = 有效且已采纳（原子化+去重：MEMORY 2561→1918、USER 1342→1215，WR 0%→100%，召回 76%→100%）。
  - B byterover 弃维护（2026-10-15 移出 core、install.sh 404、643 子包）→ **墓碑**。
  - C 云语义 provider 需账号/API key/通常付费 → 不符合「零新增依赖」护栏，**墓碑**。
  - 补充：TencentDB-Agent-Memory（MIT、30k star、2026-11-10 更新、**自带 hermes-plugin**）由 owner 指出，是更强候选，但需 Node≥22 边车 + 常驻 Gateway + LLM 抽取 key → 仍违反「零新增依赖」护栏，故未选。
  - **最终路线**：内建原子化（会话层） + cs MCP 打通（长期知识层），见 cs 打通卡。

## 附：候选非技术的真实参照（GitHub 等）

> 只作为"存在生产案例"的旁证，不替代实测。记录来源与关键信号。原生 search_web 被本账户 403，改用 magpie web-search 取。

| 候选 | 参照项目 | star | 最近 commit | 生产案例 | 备注 |
|---|---|---|---|---|---|
| B | NousResearch/hermes（byterover provider 已移出 core）、NousResearch/hermes-plugin-byterover | — | 2026-10-15 弃维护 | 官方文档列 8 provider | provider 弃维护：HANDOFF.md |
| B | hermes-agent.nousresearch.com/docs/user-guide/features/memory-providers | — | 当月 | 8 official provider | 官方交付入口 |
| C | mem0 / supermemory / hindsight 等 | — | — | 需实测 | 均 cloud/账号/付费类 |
| 附 | factledger（community tier v1.0.0） | 0 | 更新 1 天前 | — | 非官方，stdlib/本地/免账号，可作 B 的本地替代再测 |
| 附 | mem-os（community） | 0 | — | — | 需 Node/npm，本地 SQLite |