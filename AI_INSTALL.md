# AI Install — 让 AI 帮你安装 dsh-hotkeys

> 给 AI 编码代理（DeepSeek / Claude / 其他）的一句话提示词，以及完整可执行步骤。
> 你也可以把本文件路径直接发给 AI：`https://github.com/ctenni/dsh-hotkeys/blob/main/AI_INSTALL.md`

## 一句话提示词（AI install）

> 请帮我安装 dsh-hotkeys 插件到 DeepSeek Harness 的 web profile：在任意目录执行
> `dsh plugin --profile web add dsh-hotkeys`，然后重启 `dsh web` 并强刷浏览器（Ctrl+F5），
> 最后在消息输入框输入 `/hotkeys` 验证菜单能弹出，并在浏览器控制台执行
> `window.__dshHotkeys.getBindings()` 确认返回 `{ send, newline, customAnswerSubmit }`。
> 若 `dsh plugin` 不可用，则手动：`cd ~/.dsh/profiles/web && pnpm add dsh-hotkeys`，
> 再把 `"dsh-hotkeys"` 加进该目录 `package.json` 的 `dsh.profile.bundles` 数组后重启。

## AI 执行时遵循的步骤（详细版）

### 1. 确认环境

- DeepSeek Harness 已安装，命令行 `dsh` 可用；
- web profile 存在（`dsh web` 跑起来过）；
- `pnpm` 可用（`npm install -g pnpm` 可装）。

### 2. 安装（两种方式任选）

**方式 A：官方 dsh plugin（推荐，自动加入 bundle 列表）**

```powershell
dsh plugin --profile web add dsh-hotkeys
```

DSH 会自动：pnpm 安装 → 检测到 `dsh.bundle` 声明 → 把 `dsh-hotkeys` 写进 `package.json` 的
`dsh.profile.bundles`。

**方式 B：手动安装（pnpm add 后必须手动加 bundles）**

```powershell
cd $env:USERPROFILE\.dsh\profiles\web   # Windows；macOS/Linux: cd ~/.dsh/profiles/web
pnpm add dsh-hotkeys
```

然后编辑该目录 `package.json`，把 `"dsh-hotkeys"` 加进 `dsh.profile.bundles` 数组：

```jsonc
"dsh": {
  "profile": {
    "bundles": [
      "@deepseek-ai/dsh-base",
      "@deepseek-ai/dsh-web-app",
      "dsh-hotkeys"        // ← 必须加，否则不生效
    ]
  }
}
```

> ⚠️ `pnpm add` 不会自动改 `bundles` 列表；DSH 按该列表加载插件，漏加则不生效。

### 3. 重启生效

- 停掉正在运行的 `dsh web`（Ctrl+C）；
- 重新运行 `dsh web`；
- 浏览器强刷（Ctrl+F5）或清缓存，确保加载新 bundle。

### 4. 验证

1. 消息输入框输入 `/hotkeys` → 应弹出菜单（三个预设 + 三个录制项）。
2. 浏览器控制台（F12 → Console）执行：

```js
window.__dshHotkeys.getBindings()
```

应返回类似：

```json
{ "send": "Ctrl+Enter", "newline": "Enter", "customAnswerSubmit": "Enter" }
```

## 常见问题（AI 排查用）

| 现象 | 原因 | 处理 |
| --- | --- | --- |
| `/hotkeys` 命令出不来 | `dsh-hotkeys` 没进 `bundles` 列表 | 手动加进 `dsh.profile.bundles` 后重启 |
| `window.__dshHotkeys` 是 undefined | 插件未加载 / 浏览器还是旧 bundle | 重启 `dsh web` + 强刷（Ctrl+F5） |
| `dsh plugin` 报错 | 缺 `--profile` 或 pnpm 未装 | `dsh plugin --profile web add dsh-hotkeys`；先装 pnpm |
| 想卸载 | —— | `dsh plugin --profile web remove dsh-hotkeys`（或手动删依赖+bundles 行） |

## 项目信息

- GitHub: https://github.com/ctenni/dsh-hotkeys
- npm: https://www.npmjs.com/package/dsh-hotkeys
- 详细安装说明见 [README.md](./README.md)
