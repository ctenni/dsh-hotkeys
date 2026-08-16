# dsh-sendkeys 使用与复现教程

`dsh-sendkeys` 是用于 **DeepSeek Harness Web GUI**（`dsh web`）的一个**浏览器端快捷键自定义插件**。它把消息发送、换行，以及本次新增的「自定义答案提交」三个动作的触发键，改成**可由用户录制、随时切换**的组合键。配置保存在浏览器 `localStorage`，无需后端。

本教程分两部分：

1. **使用说明** —— 作为普通用户怎么用，尤其是新增的「自定义答案提交键」。
2. **复现/扩展插件的 Prompt** —— 把这份 Prompt 喂给 DeepSeek，即可复现或继续改造本插件。

---

## 一、使用说明

### 1. 插件装在哪、怎么生效

- 源码目录（本目录）：`dsh-sendkeys/`
  - `cordis.patch.yml` —— 把插件行插入所选 DSH profile 组合的 bundle patch。
  - `package.json` —— 插件元信息；通过 `dsh.bundle.patch` 和 `dsh.client` 声明挂载到 web profile。
  - `lib/index.js` —— 宿主侧（Host）最小 Cordis 插件，目前仅占位。
  - `lib/client.js` —— **浏览器端（Client）核心逻辑**，所有快捷键行为都在这。
- 挂载方式：web profile 的 `package.json` 用 `link:` 把本目录打进 bundle，例如：

  ```jsonc
  "dependencies": {
    "dsh-sendkeys": "link:C:/Users/Administrator/Downloads/dsh-sendkeys"
  }
  ```

- **修改源码后要重启 `dsh web` 并刷新浏览器页面才会生效**（它是 bundle 插件，非运行时加载的动态插件，无 dev 热更）。

### 2. 三个可自定义的动作

插件维护一张「动作 → 组合键」绑定表，任意组合键均可设置：

| 动作 | 含义 | 默认键 |
| --- | --- | --- |
| `send` | 在消息输入框（composer）发送 | `Control+Enter`（safe 预设） |
| `newline` | 在消息输入框插入换行 | `Enter`（safe 预设） |
| `customAnswerSubmit` | **在 DeepSeek 提问卡的「输入你的答案」输入框里提交/继续** | `Enter` |

> `send` 与 `newline` 的行为由预设决定，见下文 §4。三个动作互不干扰。

### 3. 新增的「自定义答案提交键」

DeepSeek 通过 `ask_user_question` 向用户提问时，会在输入区渲染一张「提问卡」——包含若干推荐方案，以及最下方一个 **「输入你的答案」输入框**。用户既可点选方案，也可输入自定义答案。

- **原本行为**：在这个输入框里按 **裸 `Enter`** = 提交/继续（进入下一题或完成回答）；`Shift+Enter` = 换行。
- **本插件增强**：把「提交/继续」的触发键替换成可录制的 `customAnswerSubmit`，让你可以把它设成自己喜欢的组合键（例如 `Ctrl+Enter`），并可随时切换回 `Enter`。

#### 设置/切换方法（推荐）

1. 触发一次带选项的 `ask_user_question`，让提问卡出现。
2. 把光标放进提问卡的「输入你的答案」输入框。
3. 输入 `/sendkeys`，在弹出菜单中选择「🎙 录制『自定义答案提交』键」。
4. 按提示按下你想要的**组合键**（示例：`Ctrl+Enter`）即可生效，会有顶部提示确认。
5. 想换回或再改，重复第 2–4 步即可。

也可在浏览器控制台直接设置：

```js
window.__dshSendKeys.setBinding('customAnswerSubmit', 'Ctrl+Enter') // 设成组合键
window.__dshSendKeys.setBinding('customAnswerSubmit', 'Enter')      // 改回默认
```

#### 行为细节（防误触设计）

| 你的绑定 | 触发提交的组合键 | 此时裸 `Enter` 会怎样 |
| --- | --- | --- |
| `Enter`（默认） | 裸 Enter | 放行给产品原生提交手势 |
| `Ctrl+Enter` 等组合键 | 该组合键 | **不再提交**，改成换行（多行 textarea）或无效（单行 input），避免误触提交 |
| `Shift+Enter` | Share+Enter 放行 | 交给产品自身做换行（始终可用） |

这个「设成组合键后，裸 Enter 退化为换行/无效」的设计，与 sendkeys 的 `safe`（防误触）预设理念一致。

兼容性：

- 同时支持提问卡的**单行 `<input>`**（有预置选项时）和**多行 `<textarea>`**（无选项时）两种形态。
- 通过稳定的 `data-question-key` DOM 属性定位提问卡，不依赖会被编译改名的 CSS 类名。
- 中文输入法（IME）合成中的按键、以及下拉/菜单/对话框打开时的按键一律放行，不影响输入和菜单选择。

### 4. 原有的发送 / 换行键与预设

`/sendkeys` 命令里还提供三个预设，影响 `send` 和 `newline`：

| 预设 | 说明 | send | newline |
| --- | --- | --- | --- |
| `safe` | 防误触：Enter 换行 / Ctrl+Enter 发送 | `Control+Enter` | `Enter` |
| `default` | DSH 默认：Enter 发送 / Shift+Enter 换行 | `Enter` | （不拦截） |
| `im` | IM 风格：Enter 发送 / Shift+Enter 换行 | `Enter` | `Shift+Enter` |

> 切换预设只会影响 `send` / `newline`，**不会覆盖**你单独设置好的 `customAnswerSubmit`。

### 5. 持久化与恢复

- 配置保存在 `localStorage` 的键 `dsh.sendkeys.v1`。
- 想恢复默认：在 `/sendkeys` 里选 `safe` 预设，并把 `customAnswerSubmit` 重新录制成 `Enter`；或清除该 localStorage 键后刷新页面。
- `localStorage` 不可用（隐私模式等）时静默降级为仅本次会话生效。

---

## 二、复现 / 扩展此插件的 DeepSeek Prompt

下面对话可直接发给 DeepSeek（用 `dsh web` 环境的编码代理），即可复现本插件，或在「自定义答案提交键」功能上继续扩展。其中的技术条目也用于约束实现，确保代码可运行。

```markdown
# 任务：为 DeepSeek Harness Web GUI 开发一个「发送 / 换行 / 自定义答案提交」快捷键自定义的浏览器端插件

## 背景
它要作为 bundle 插件挂到 web profile，只在浏览器端工作（纯 DOM + localStorage），不改动后端。
产品界面：DeepSeek 消息输入框是 textarea；当模型调用 ask_user_question 提问时，
消息输入区会被「提问卡」接管，里面最下方有一个「输入你的答案」输入框。

## 已有插件结构（在其基础上扩展即可）
- cordis.patch.yml：bundle patch，把插件行插入 profile 组合：
    - insert:
        - id: dsh-sendkeys
          name: dsh-sendkeys
- package.json：name=dsh-sendkeys，type=module；
    dsh.bundle.patch 指到 ./cordis.patch.yml；
    dsh.client { platform: "web", inject: ["@deepseek-ai/dsh-client-runtime"] }
- lib/index.js：宿主侧最小 Cordis 插件，apply(ctx){ ctx.effect(() => () => {}) } 占位。
- lib/client.js：浏览器端主体，见下方要求。

## 浏览器端（lib/client.js）要满足的功能
1. 一张「动作 → 组合键」绑定表，任意组合键均可设置，产物是纯 JavaScript（无 TypeScript/import/JSX）。
   - 动作 send：在 composer textarea 发送。若绑定为 Enter / Ctrl+Enter / Meta+Enter 直接放行给 DSH 内置发送手势；
     若绑定为其它键（如 F9）则拦截该键并合成一次 Enter 触发发送。
   - 动作 newline：换行。匹配时拦截并在光标处插入 \n；留空表示不拦截。
   - 动作 customAnswerSubmit：在「提问卡的『输入你的答案』输入框」里提交/继续。
        - 用 DOM 属性 data-question-key 定位该提问卡容器，只认其内部的 input[type=text] 与 textarea。
        - 默认绑定 Enter；绑定为其它组合键时，拦截该组合键并合成一次裸 Enter（触发产品 continueFlow）；
          此时原裸 Enter 应被 preventDefault 并退化为换行（textarea）/丢弃（单行 input），避免误触提交。
        - Shift+Enter 等其它 Enter 组合始终放行给产品内置换行。
2. 配置读写 localStorage（键 dsh.sendkeys.v1），loadConfig 至少对 send/newline/customAnswerSubmit 三个字段做兜底合并。
3. 组合键解析/描述/匹配（parseCombo、describeCombo、matchCombo）支持 ctrl/meta/shift/alt 与常见别名。
4. IME 合成中（isComposing 或 keyCode 229）、以及 role 为 menu/listbox/dialog/combobox[aria-expanded=true]
   的弹出层打开时，一律放行不拦截。
5. 提供 window.__dshSendKeys API：getBindings / getConfig / setBinding(role, combo) / setPreset(id)。
   role 合法值 send / newline / customAnswerSubmit；setPreset 切换 preset 时不得覆盖 customAnswerSubmit。
6. 注册 /sendkeys 命令（经 ctx.get('commandUi') 的 register，commandUi 不可用时降级不影响按键拦截）：
   - 列出预设：safe（Enter 换行/Ctrl+Enter 发送）、default（Enter 发送）、im（Enter 发送/Shift+Enter 换行）；
   - 提供「录制发送键」「录制换行键」「录制自定义答案提交键」三项：进入 15s 录制态，按下组合键即绑定，Esc 取消。
7. 挂载：用 window.__ModuleLoader__.load({ id:'dsh-sendkeys', factory:(require)=>{ /* CommonJS 风格模块 */ } })；
   apply(ctx) 里用 ctx.effect 注册全局 keydown（capture:true）监听与 /sendkeys 命令；卸载时移除监听与 window.__dshSendKeys。

## 验收
- node --check lib/client.js 通过。
- 重启 dsh web 并刷新页面后：按 Enter 在 composer 发送/换行符合所选预设；
- 用 /sendkeys 录制 customAnswerSubmit 为组合键后，在提问卡的「输入你的答案」框里用该组合键提交、裸 Enter 不再误触提交。
```

---

> 文档末次整理：`customAnswerSubmit`（自定义答案提交键）功能加入后。
