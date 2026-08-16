# DSH Hotkeys

> 原项目名 `dsh-sendkeys`，现已改名为 **`dsh-hotkeys`** 并开源到 GitHub、发布到 npm。

DeepSeek Harness 快捷键增强插件（浏览器端 bundle 插件）。支持**发送 / 换行 / 自定义答案提交**三类热键的自定义，通过录制即可随时切换，配置保存在浏览器 `localStorage`，无需后端。

## ✨ 功能特性

- ⌨️ **热键录制**：发送、换行、自定义答案提交三个动作的触发键均可录制、可随时切换。
- 🚀 **快速发送**：把「发送」绑定到任何你习惯的组合键（Enter / Ctrl+Enter / F9 等）。
- 🎨 **自定义答案增强**：DeepSeek 提问卡（`ask_user_question`）的「输入你的答案」输入框提交键可自定义，防误触提交。
- 🛡️ **防 Enter 系泄漏**：提交键设为 `Ctrl+Enter`/`Alt+Enter` 时，另一个 Enter 组合键不会抢发消息。

## 🤖 AI install（让 AI 帮你安装）

现在很多用户直接让 AI 编码代理来装插件。把下面这句提示词发给你的 AI（DeepSeek / Claude 等），它会自动完成安装：

> 请帮我安装 `dsh-hotkeys` 插件到 DeepSeek Harness 的 web profile：执行 `dsh plugin --profile web add dsh-hotkeys`，然后重启 `dsh web` 并强刷浏览器（Ctrl+F5），最后在消息输入框输入 `/hotkeys` 验证菜单能弹出，并在浏览器控制台执行 `window.__dshHotkeys.getBindings()` 确认返回三个绑定字段。

完整的给 AI 的安装指令（含手动方式、排查、验证）见：**[AI_INSTALL.md](https://github.com/ctenni/dsh-hotkeys/blob/main/AI_INSTALL.md)**

## 📦 安装方法

### 前置条件

- 已安装 [DeepSeek Harness](https://github.com/deepseek-ai/dsh)（命令行 `dsh` 可用）。
- 已跑起来过 web profile（`dsh web`），这样 `$DSH_HOME/profiles/web` 才会存在。
- 需要 `pnpm` 或 `npm` 包管理器。

### 方式一：通过 `dsh plugin` 安装（推荐，一键）

DSH 官方提供了 `dsh plugin` 命令来管理 profile 的插件，它会自动把插件加进 bundle 列表，无需手动改配置。

```powershell
# 在任意目录执行；--profile 指定要装到哪个 profile（web 即 web GUI）
dsh plugin --profile web add dsh-hotkeys
```

执行完，DSH 会：
1. 在 `~/.dsh/profiles/web` 里 `pnpm add dsh-hotkeys`（下载包 + 写入 dependencies）；
2. **自动把 `dsh-hotkeys` 加进 `package.json` 的 `dsh.profile.bundles`**（因为它声明了 `dsh.bundle`）；
3. 提示已初始化/安装完成。

> 依赖 `pnpm`。若没装 pnpm：`npm install -g pnpm`。

### 方式二：手动安装（npm/pnpm 直接装）

如果不用 `dsh plugin`，也可以手动装，但**多一步：必须自己把插件加进 bundle 列表**（这是最容易漏的步骤）。

**第 1 步：进入 web profile 目录**

```powershell
cd $env:USERPROFILE\.dsh\profiles\web   # Windows
# cd ~/.dsh/profiles/web                # macOS / Linux
```

> 目录不存在？先跑一次 `dsh web` 再停掉，profile 会被创建。

**第 2 步：安装包**

```powershell
pnpm add dsh-hotkeys
# 或 npm install dsh-hotkeys
```

**第 3 步：把插件加入 bundle 列表（关键，不能省）**

打开同目录 `package.json`，在 `dsh.profile.bundles` 数组里加 `"dsh-hotkeys"`：

```jsonc
{
  "dependencies": {
    "dsh-hotkeys": "^0.1.1"      // 第 2 步已自动写入
  },
  "dsh": {
    "profile": {
      "bundles": [
        "@deepseek-ai/dsh-base",
        "@deepseek-ai/dsh-web-app",
        "dsh-hotkeys"              // ← 手动加这一行
      ]
    }
  }
}
```

> ⚠️ `pnpm add` 只下载包并写 `dependencies`，**不会自动改 `bundles` 列表**。DSH 按 `bundles` 列表加载插件，不加这行，包装了也不会生效。

**第 4 步：重启生效**

- 停掉正在运行的 `dsh web`（Ctrl+C 或关掉启动它的终端）。
- 重新运行 `dsh web`。
- 浏览器强刷（Ctrl+F5）。

**第 5 步：验证**

在消息输入框输入：

```
/hotkeys
```

应弹出菜单（三个预设 + 三个录制项：发送 / 换行 / 自定义答案提交）。或在浏览器控制台（F12 → Console）执行：

```js
window.__dshHotkeys.getBindings()
```

应返回 `{ send, newline, customAnswerSubmit }`。

### 方式三：GitHub 仓库 + link（开发用）

```powershell
git clone https://github.com/ctenni/dsh-hotkeys.git
```

把 `dsh-hotkeys` 目录用 `link:` 挂到 web profile 的 `package.json`：

```jsonc
"dependencies": {
  "dsh-hotkeys": "link:C:/path/to/dsh-hotkeys"
}
```

同样需要执行方式二的第 3 步（把 `"dsh-hotkeys"` 加进 `bundles`）、第 4 步（重启）和第 5 步（验证）。

> 三种方式都是 bundle 插件：**修改源码后需重启 `dsh web` 并刷新浏览器页面**才会生效（无 dev 热更）。

## ⚙️ 使用说明

### 三个可自定义的动作

| 动作 | 含义 | 默认键 |
| --- | --- | --- |
| `send` | 在消息输入框（composer）发送 | `Control+Enter`（safe 预设） |
| `newline` | 在消息输入框插入换行 | `Enter`（safe 预设） |
| `customAnswerSubmit` | 在 DeepSeek 提问卡的「输入你的答案」输入框里提交/继续 | `Enter` |

### 自定义答案提交键（核心增强）

DeepSeek 通过 `ask_user_question` 提问时，输入区会被「提问卡」接管，最下方是「输入你的答案」输入框。

- **原本行为**：裸 `Enter` = 提交/继续；`Shift+Enter` = 换行。
- **本插件增强**：把「提交/继续」的触发键替换成可录制的 `customAnswerSubmit`。

**设置/切换（推荐）**：触发提问卡 → 光标放入「输入你的答案」框 → 输入 `/hotkeys` → 选「🎙 录制『自定义答案提交』键」→ 按下目标组合键（如 `Ctrl+Enter`）。

也可在浏览器控制台设置：

```js
window.__dshHotkeys.setBinding('customAnswerSubmit', 'Ctrl+Enter') // 设成组合键
window.__dshHotkeys.setBinding('customAnswerSubmit', 'Enter')      // 改回默认
```

**防误触行为**：

| 你的绑定 | 触发提交的组合键 | 裸 `Enter` 行为 |
| --- | --- | --- |
| `Enter`（默认） | 裸 Enter | 放行给产品原生提交手势 |
| `Ctrl+Enter` 等组合键 | 该组合键 | **不再提交**，改成换行（textarea）/无效（单行 input） |
| `Shift+Enter` | —— | 放行产品内置换行 |

**防 Enter 系泄漏**：提交键设为 `Ctrl+Enter` 时，`Alt+Enter` 会被拦截消化，不再触发 DSH 原生发送；反之亦然。设 F9 等非 Enter 键时，Ctrl/Alt+Enter 仍可发送。

### 预设（影响 send / newline）

| 预设 | 说明 | send | newline |
| --- | --- | --- | --- |
| `safe` | 防误触：Enter 换行 / Ctrl+Enter 发送 | `Control+Enter` | `Enter` |
| `default` | DSH 默认：Enter 发送 / Shift+Enter 换行 | `Enter` | （不拦截） |
| `im` | IM 风格：Enter 发送 / Shift+Enter 换行 | `Enter` | `Shift+Enter` |

> 切换预设不影响你单独设置的 `customAnswerSubmit`。

### 持久化

- 配置保存在 `localStorage` 键 `dsh.sendkeys.v1`（改名自 `dsh-sendkeys`，键名保留兼容旧配置）。
- 恢复默认：`/hotkeys` 里选 `safe` 预设并把 `customAnswerSubmit` 录回 `Enter`，或清除该键后刷新。

## 🧠 复现 / 扩展插件的 DeepSeek Prompt

下面对话可直接发给 DeepSeek（用 `dsh web` 环境的编码代理），即可复现本插件或在「自定义答案提交键」上继续扩展。

```markdown
# 任务：为 DeepSeek Harness Web GUI 开发一个「发送 / 换行 / 自定义答案提交」热键自定义的浏览器端插件

## 背景
它作为 bundle 插件挂到 web profile，只在浏览器端工作（纯 DOM + localStorage），不改动后端。
产品界面：DeepSeek 消息输入框是 textarea；当模型调用 ask_user_question 提问时，
消息输入区会被「提问卡」接管，里面最下方有一个「输入你的答案」输入框。

## 插件结构
- cordis.patch.yml：bundle patch，把插件行插入 profile 组合：
    - insert:
        - id: dsh-hotkeys
          name: dsh-hotkeys
- package.json：name=dsh-hotkeys，type=module；
    dsh.bundle.patch 指到 ./cordis.patch.yml；
    dsh.client { platform: "web", inject: ["@deepseek-ai/dsh-client-runtime"] }
- lib/index.js：宿主侧最小 Cordis 插件，apply(ctx){ ctx.effect(() => () => {}) } 占位。
- lib/client.js：浏览器端主体，见下方要求。

## 浏览器端（lib/client.js）要满足的功能
1. 一张「动作 → 组合键」绑定表，任意组合键均可设置，纯 JavaScript（无 TypeScript/import/JSX）。
   - 动作 send：在 composer textarea 发送。绑定为 Enter/Ctrl+Enter/Meta+Enter 时放行 DSH 内置发送手势；
     绑定为其它键（如 F9）则拦截该键并合成一次 Enter 触发发送。
   - 动作 newline：换行。匹配时拦截并在光标处插入 \n；留空表示不拦截。
   - 动作 customAnswerSubmit：在「提问卡的『输入你的答案』输入框」里提交/继续。
        - 用 DOM 属性 data-question-key 定位提问卡容器，只认其内部的 input[type=text] 与 textarea。
        - 默认绑定 Enter；绑定为其它组合键时拦截该组合键并合成一次裸 Enter（触发产品 continueFlow）；
          此时原裸 Enter 应 preventDefault 并退化为换行（textarea）/丢弃（单行 input），避免误触提交。
        - 防泄漏：当提交绑定是 Enter 系组合键（Ctrl/Alt/Meta+Enter）时，其余 Enter 组合键一律拦截消化，
          避免它们落回 DSH 原生「Enter 系发送」（否则会出现设 Ctrl+Enter 则 Alt+Enter 也发）。
          提交绑定是非 Enter 键（如 F9）时放行 Ctrl/Alt+Enter 给 DSH 原生发送。
        - 合成的裸 Enter 事件需打标记（如 __dshHotkeysSynthetic），在处理入口识别并放行，避免二次拦截。
2. 配置读写 localStorage（键 dsh.sendkeys.v1），loadConfig 对 send/newline/customAnswerSubmit 三个字段做兜底合并。
3. 组合键解析/描述/匹配（parseCombo、describeCombo、matchCombo）支持 ctrl/meta/shift/alt 与常见别名。
4. IME 合成中（isComposing 或 keyCode 229）、以及 role 为 menu/listbox/dialog/combobox[aria-expanded=true]
   的弹出层打开时，一律放行不拦截。
5. 提供 window.__dshHotkeys API：getBindings / getConfig / setBinding(role, combo) / setPreset(id)。
   role 合法值 send / newline / customAnswerSubmit；setPreset 切换 preset 时不得覆盖 customAnswerSubmit。
6. 注册 /hotkeys 命令（经 ctx.get('commandUi') 的 register，commandUi 不可用时降级不影响按键拦截）：
   - 列出预设：safe（Enter 换行/Ctrl+Enter 发送）、default（Enter 发送）、im（Enter 发送/Shift+Enter 换行）；
   - 提供「录制发送键」「录制换行键」「录制自定义答案提交键」三项：进入 15s 录制态，按下组合键即绑定，Esc 取消。
7. 挂载：用 window.__ModuleLoader__.load({ id:'dsh-hotkeys', factory:(require)=>{ /* CommonJS 风格模块 */ } })；
   apply(ctx) 里用 ctx.effect 注册全局 keydown（capture:true）监听与 /hotkeys 命令；卸载时移除监听与 window.__dshHotkeys。

## 验收
- node --check lib/client.js 通过。
- 重启 dsh web 并刷新页面后：按 Enter 在 composer 发送/换行符合所选预设；
- 用 /hotkeys 录制 customAnswerSubmit 为组合键后，在提问卡的「输入你的答案」框里用该组合键提交、裸 Enter 不再误触提交；
- 设 Ctrl+Enter 后 Alt+Enter 不再发送（防泄漏）。
```

## 📄 License

MIT License
