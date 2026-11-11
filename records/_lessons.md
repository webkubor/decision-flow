# 经验库 — 跨轮沉淀

> 每次 R 步把「验证过的结论」追加到本文件，格式：
> `[YYYY-MM-DD] <结论>（来源：<记录文件名>）`
>
> 只追加，不删除历史结论——包括被推翻的结论。被推翻本身也是数据。

<!-- 记录从此处开始追加 ↓ -->

- [2026-11-11] Flow 1.0 建立：五步循环（S/H/M/P/R）+ P-1..P-7 固定字段 + 六条迭代规则（来源：README.md 首版）
- [2026-11-11] 对「6 个月不写代码」的 owner，选记忆/依赖方案先看「安装几步、要不要账号/付费、上游还活不活」，再看召回；本地免费里「内建原子化」是最低摩擦解（来源：2026-11-11-hermes-memory-provider.md）
- [2026-11-11] 被推翻：ByteRover 不是「免费且活跃维护」——已于 2026-10-15 从 Hermes core 移除转 standalone 且标 Unmaintained，其 install.sh 实测 404；「memory 超限只丢多余」也不是——实际整次 add 报错（来源：2026-11-11-hermes-memory-provider.md）
- [2026-11-11] 记忆结构的正确分层：cs 管长期可检索知识（规则/复盘/决策），Hermes 内建只管会话必知事实；打通方式是 stdio MCP（`cs mcp serve` → `hermes mcp add`），零新增依赖（来源：2026-11-11-hermes-cs-memory-structure.md）
- [2026-11-11] 原子化不降召回反而升召回：USER.md 召回 76%→100%，因长散文把事实埋在句中导致单条查询命中不了；字符同时从 2561/1342 降到 1918/1215（来源：2026-11-11-hermes-cs-memory-structure.md）
- [2026-11-11] 选型先问「要不要新装东西/新账号/新常驻进程」：此护栏直接否掉 byterover、TencentDB-Agent-Memory 与全部云语义 provider（来源：2026-11-11-hermes-cs-memory-structure.md）
