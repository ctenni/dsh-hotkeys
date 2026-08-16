# DSH Hotkeys

DeepSeek Harness 快捷键增强插件（浏览器端 bundle 插件）。支持**发送 / 换行 / 自定义答案提交**三类热键的自定义，通过录制即可随时切换，配置保存在浏览器 `localStorage`，无需后端。

## ✨ 功能特性

- ⌨️ **热键录制**：发送、换行、自定义答案提交三个动作的触发键均可录制、可随时切换。
- 🚀 **快速发送**：把「发送」绑定到任何你习惯的组合键（Enter / Ctrl+Enter / F9 等）。
- 🎨 **自定义答案增强**：DeepSeek 提问卡（`ask_user_question`）的「输入你的答案」输入框提交键可自定义，防误触提交。
- 🛡️ **防 Enter 系泄漏**：提交键设为 `Ctrl+Enter`/`Alt+Enter` 时，另一个 Enter 组合键不会抢发消息。

## 🤖 AI install（让 AI 帮你安装）

把下面这句提示词发给你的 AI（DeepSeek / Claude 等），它会自动完成安装：

> 请帮我安装 `dsh-hotkeys` 插件到 DeepSeek Harness 的 web profile：执行 `dsh plugin --profile web add dsh-hotkeys`，然后重启 `dsh web` 并强刷浏览器（Ctrl+F5），最后在消息输入框输入 `/hotkeys` 验证菜单能弹出，并在浏览器控制台执行 `window.__dshHotkeys.getBindings()` 确认返回三个绑定字段。

完整的给 AI 的安装指令（含手动方式、排查、验证）见：**[AI_INSTALL.md](https://github.com/ctenni/dsh-hotkeys/blob/main/AI_INSTALL.md)**

## 📦 安装方法

### 方式一：通过 `dsh plugin` 安装（推荐，一键）

```powershell
dsh plugin --profile web add dsh-hotkeys
```

DSH 会自动：pnpm 安装 → 检测到 `dsh.bundle` 声明 → 把 `dsh-hotkeys` 写进 `package.json` 的 `dsh.profile.bundles`。

> 依赖 `pnpm`。若没装：`npm install -g pnpm`。

### 方式二：手动安装（npm/pnpm 直接装）

```powershell
cd $env:USERPROFILE\.dsh\profiles\web   # Windows；macOS/Linux: cd ~/.dsh/profiles/web
pnpm add dsh-hotkeys
```

然后**必须**手动把 `"dsh-hotkeys"` 加进该目录 `package.json` 的 `dsh.profile.bundles` 数组：

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

### 方式三：GitHub 仓库 + link（开发用）

```powershell
git clone https://github.com/ctenni/dsh-hotkeys.git
```

用 `link:` 挂到 web profile 的 `package.json`：

```jsonc
"dependencies": {
  "dsh-hotkeys": "link:C:/path/to/dsh-hotkeys"
}
```

同样需要把 `"dsh-hotkeys"` 加进 `bundles`。

> 三种方式装完后都要：**重启 `dsh web` + 强刷浏览器（Ctrl+F5）**。验证：输入 `/hotkeys` 应弹出菜单；或 Console 执行 `window.__dshHotkeys.getBindings()`。

## ⚙️ 使用说明

### 三个可自定义的动作

| 动作 | 含义 | 默认键 |
| --- | --- | --- |
| `send` | 在消息输入框（composer）发送 | `Control+Enter`（safe 预设） |
| `newline` | 在消息输入框插入换行 | `Enter`（safe 预设） |
| `customAnswerSubmit` | 在 DeepSeek 提问卡的「输入你的答案」输入框里提交/继续 | `Enter` |

## 📄 License

MIT License
