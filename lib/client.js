window.__ModuleLoader__.load({
	id: "dsh-hotkeys",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });

		/**
		 * dsh-hotkeys —— DSH Web 热键自定义（浏览器端，可自定义设置）。
		 *
		 * 自定义模型：一张「动作 → 组合键」绑定表，任意组合键均可设置。
		 *   - send（发送）：默认 Control+Enter。若绑定的是 Enter/Ctrl+Enter/Meta+Enter，
		 *     直接放行给 DSH 内置发送手势；若绑定其他键（如 F9），拦截该键并合成一次
		 *     Enter 按下触发 DSH 发送（实验性，需实测）。
		 *   - newline（换行）：默认 Enter。匹配时拦截并插入换行；留空表示不拦截。
		 *     （DSH 内置 Shift+Enter 换行始终可用。）
		 *   - customAnswerSubmit（自定义答案提交/继续）：作用于 DeepSeek 提问卡
		 *     （ask_user_question 工具视图替换了消息输入区）里的「输入你的答案」输入框。
		 *     默认 Enter（保持产品的原生行为）；可录制为其它组合键。设为非-Enter 组合键后，
		 *     原裸 Enter 不再提交，而回落到换行/无效，避免误触提交。
		 *
		 * 设置入口：
		 *   - 输入框输入 /hotkeys 命令：选择预设，或「录制」各动作的键（按提示按组合键）；
		 *   - 浏览器控制台：window.__dshHotkeys.setBinding('send', 'Control+Shift+Enter')。
		 * 配置持久化在 localStorage（键 dsh.sendkeys.v1；改名自 dsh-sendkeys，键名保留兼容旧配置）。
		 *
		 * 后期扩展其他快捷键：往 KEYMAP 注册表加一行（见下）。
		 */

		exports.name = 'dsh-hotkeys-client'

		const STORAGE_KEY = 'dsh.sendkeys.v1'

		// 预设：{ id, label, bindings: { send, newline } }（newline 空串 = 不拦截）
		const PRESETS = {
			'safe':    { label: '防误触：Enter 换行 / Ctrl+Enter 发送', bindings: { send: 'Control+Enter', newline: 'Enter' } },
			'default': { label: 'DSH 默认：Enter 发送 / Shift+Enter 换行', bindings: { send: 'Enter', newline: '' } },
			'im':      { label: 'IM 风格：Enter 发送 / Shift+Enter 换行', bindings: { send: 'Enter', newline: 'Shift+Enter' } },
		}

		const DEFAULT_BINDINGS = { ...PRESETS.safe.bindings, customAnswerSubmit: 'Enter' }

		// ---------------------------------------------------------------------------
		// 配置读写（localStorage）
		// ---------------------------------------------------------------------------

		function loadConfig() {
			try {
				const raw = localStorage.getItem(STORAGE_KEY)
				if (!raw) return { bindings: { ...DEFAULT_BINDINGS } }
				const parsed = JSON.parse(raw)
				const bindings = { ...DEFAULT_BINDINGS }
				for (const role of ['send', 'newline', 'customAnswerSubmit']) {
					if (typeof parsed.bindings?.[role] === 'string') bindings[role] = parsed.bindings[role]
				}
				return { bindings }
			} catch {
				return { bindings: { ...DEFAULT_BINDINGS } }
			}
		}

		function saveConfig(config) {
			try {
				localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
			} catch {
				// localStorage 不可用（隐私模式等）时静默降级：配置仅本次会话生效
			}
		}

		// ---------------------------------------------------------------------------
		// 组合键解析与描述
		// ---------------------------------------------------------------------------

		const MODIFIER_ALIASES = {
			ctrl: 'ctrl', control: 'ctrl', '⌃': 'ctrl',
			meta: 'meta', cmd: 'meta', command: 'meta', win: 'meta', '⌘': 'meta',
			shift: 'shift', '⇧': 'shift',
			alt: 'alt', option: 'alt', '⌥': 'alt',
		}

		/** "Control+Shift+Enter" → { key:'Enter', ctrl:true, meta:false, shift:true, alt:false } */
		function parseCombo(text) {
			const combo = { key: '', ctrl: false, meta: false, shift: false, alt: false }
			for (const part of String(text).split('+')) {
				const token = part.trim()
				if (!token) continue
				const mod = MODIFIER_ALIASES[token.toLowerCase()]
				if (mod) {
					combo[mod] = true
				} else {
					combo.key = token // 最后一个非修饰键作为主键
				}
			}
			return combo
		}

		/** KeyboardEvent → 组合键字符串（录制时使用） */
		function describeCombo(event) {
			if (event.key === 'Control' || event.key === 'Shift' || event.key === 'Alt' || event.key === 'Meta') return null // 纯修饰键
			const parts = []
			if (event.ctrlKey) parts.push('Ctrl')
			if (event.metaKey) parts.push('Meta')
			if (event.altKey) parts.push('Alt')
			if (event.shiftKey) parts.push('Shift')
			const key = event.key === ' ' ? 'Space' : event.key.length === 1 ? event.key.toUpperCase() : event.key
			parts.push(key)
			return parts.join('+')
		}

		function matchCombo(event, combo) {
			if (!combo || !combo.key) return false
			if (event.key.toLowerCase() !== combo.key.toLowerCase()) return false
			if (!!event.ctrlKey !== !!combo.ctrl) return false
			if (!!event.metaKey !== !!combo.meta) return false
			if (!!event.shiftKey !== !!combo.shift) return false
			if (!!event.altKey !== !!combo.alt) return false
			return true
		}

		/** DSH 内置认识的发送手势：裸 Enter / Ctrl+Enter / Meta+Enter（无 Shift/Alt）。 */
		function isDshSendGesture(event) {
			return event.key === 'Enter' && !event.altKey && !event.shiftKey
		}

		/** 是否是没有任何修饰键的裸 Enter。 */
		function isPlainEnter(event) {
			return event.key === 'Enter' && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey
		}

		// ---------------------------------------------------------------------------
		// 后期扩展快捷键动作注册表：{ 动作id: { combo, handler(event) } }
		// 例：在电脑上把消息内容插入输入框——
		//   'insertLocalContent': {
		//     combo: { key: 'v', ctrl: true, shift: true },
		//     handler: async () => { /* 读剪贴板/文件并插入 composer */ },
		//   },
		// ---------------------------------------------------------------------------
		const KEYMAP = {}

		// ---------------------------------------------------------------------------
		// 事件处理
		// ---------------------------------------------------------------------------

		/** IME（中文输入法等）合成中的按键不拦截。 */
		function isComposing(event) {
			return event.isComposing === true || event.keyCode === 229
		}

		/** 目标是否为可编辑文本框（DSH 的消息输入框是 textarea）。 */
		function isEditableTarget(target) {
			return target instanceof HTMLTextAreaElement
		}

		/** 是否有打开的弹出层（命令菜单/下拉/对话框），此时 Enter 应放行给菜单选择。 */
		function hasOpenOverlay() {
			const nodes = document.querySelectorAll('[role="menu"], [role="listbox"], [role="dialog"], [role="combobox"][aria-expanded="true"]')
			for (const el of nodes) {
				if (el.getClientRects().length > 0) return true
			}
			return false
		}

		/**
		 * 判断事件目标是否位于「自定义答案」输入框内。
		 * 该输入框来自 DeepSeek 提问卡（dsh-client-ui-user-questions 接管消息输入区时渲染），
		 * 整个提问卡容器带 `data-question-key` 属性，内部是一个单行 `<input type="text">`
		 * （有预置选项时）或一个多行 `<textarea>`（无预置选项时）。
		 * @param {EventTarget|HTMLElement|null} target
		 * @returns {HTMLElement|null} 命中的编辑元素（input/textarea），否则 null
		 */
		function customAnswerFieldFrom(target) {
			if (!(target instanceof Element)) return null
			const edit = target.closest('input[type="text"], textarea')
			if (!edit) return null
			if (!edit.closest('[data-question-key]')) return null // 只认提问卡内的输入框
			return edit
		}

		/** 在光标处插入文本，并让 React 受控组件感知（触发 input 事件）。 */
		function insertTextAtCaret(textarea, text) {
			const start = textarea.selectionStart ?? textarea.value.length
			const end = textarea.selectionEnd ?? textarea.value.length
			textarea.setRangeText(text, start, end, 'end')
			textarea.dispatchEvent(new Event('input', { bubbles: true }))
			textarea.focus()
		}

		/** 合成一次 Enter 按下（触发 DSH 的发送处理）；防重入。
		 *  合成的裸 Enter 会被我们自己的 capture 监听再次拦截，因此事件上打
		 *  `__dshHotkeysSynthetic` 标记，`handleCustomAnswerKey` 识别后直接放行。 */
		let dispatchingEnter = false
		function dispatchEnter(textarea) {
			if (dispatchingEnter) return
			dispatchingEnter = true
			try {
				const ev = new KeyboardEvent('keydown', {
					key: 'Enter', code: 'Enter', keyCode: 13, which: 13,
					bubbles: true, cancelable: true,
				})
				ev.__dshHotkeysSynthetic = true
				textarea.dispatchEvent(ev)
			} finally {
				dispatchingEnter = false
			}
		}

		/**
		 * 「自定义答案」输入框的按键路由。
		 * 产品的原生行为：裸 Enter = 提交/继续（continueFlow），Shift+Enter = 换行。
		 * 这里把「提交/继续」的触发键升级为可录制绑定 customAnswerSubmit：
		 *   - 绑定为裸 Enter（默认）→ 放行产品原生提交手势；
		 *   - 绑定为其它键/组合键（F9 / Ctrl+Enter / Alt+Enter）→ 拦截该键并合成一次裸 Enter 触发提交；
		 *   - **防泄漏修复**：仅当提交绑定属于「Enter 系组合」(Ctrl/Alt/Meta+Enter) 时，
		 *     把其余 Enter 组合键都拦截消化掉，避免它们落回 DSH 原生发送——从而杜绝
		 *     「设 Ctrl+Enter 则 Alt+Enter 也能发、设 Alt+Enter 则 Ctrl+Enter 也能发」。
		 *   - 若提交绑定是完全非 Enter 的键（如 F9），则放行 Ctrl/Alt+Enter 给 DSH 原生发送。
		 * @param {KeyboardEvent} event
		 * @param {{send: string, newline: string, customAnswerSubmit: string}} bindings
		 * @param {HTMLElement} field 命中的编辑元素（input 或 textarea）
		 */
		function handleCustomAnswerKey(event, bindings, field) {
			// 插件合成的裸 Enter（dispatchEnter 派发）：直接放行给产品 continueFlow，勿再拦截
			if (event.__dshHotkeysSynthetic === true) return
			if (isComposing(event) || hasOpenOverlay()) return
			const submitCombo = parseCombo(bindings.customAnswerSubmit || 'Enter')

			// 自定义非-Enter 组合键：拦截并合成一次裸 Enter（触发产品 continueFlow）
			if (event.key !== 'Enter' && matchCombo(event, submitCombo)) {
				event.preventDefault()
				event.stopImmediatePropagation()
				dispatchEnter(field)
				return
			}

			if (event.key !== 'Enter') return // 其余普通字符/按键：放行输入

			// 提交绑定是不是「裸 Enter」（无任何修饰键）
			const submitIsPlainEnter = submitCombo.key === 'Enter' &&
				!submitCombo.ctrl && !submitCombo.meta && !submitCombo.shift && !submitCombo.alt

			// 提交绑定是不是「Enter 系」（主键为 Enter，裸的或带修饰的）
			const submitIsEnterFamily = submitCombo.key === 'Enter'

			// 绑定命中：触发「提交/继续」
			if (matchCombo(event, submitCombo)) {
				if (submitIsPlainEnter) return // 绑定即裸 Enter：放行产品原生提交手势
				// 绑定是组合键：拦截并合成一次裸 Enter 触发产品 continueFlow
				event.preventDefault()
				event.stopImmediatePropagation()
				dispatchEnter(field)
				return
			}

			// 到这里，当前 Enter(含组合) 不是提交绑定。
			// 修复「设 Ctrl 则 Alt 也发」：仅当提交绑定属于「Enter 系组合」(如 Ctrl+Enter/Alt+Enter)
			// 时，才拦截并消化其余 Enter 组合键，防止它们落回 DSH 原生发送。
			// 若提交绑定是完全非 Enter 的键(F9)，则放行 Enter 组合给 DSH 原生发送（F9 时 Ctrl/Alt+Enter 可发）。
			if (submitIsEnterFamily && !submitIsPlainEnter) {
				event.preventDefault()
				event.stopImmediatePropagation()
				if (field instanceof HTMLTextAreaElement && isPlainEnter(event)) {
					insertTextAtCaret(field, '\n')
				}
				return
			}

			// 其它情形（提交绑定是裸 Enter，或非 Enter 键如 F9）：放行产品/DSH 原生行为
		}

		/**
		 * 主分发器。
		 * @param {KeyboardEvent} event
		 * @param {{send: string, newline: string, customAnswerSubmit: string}} bindings 配置中的绑定（字符串）
		 */
		function handleKeyDown(event, bindings) {
			// 插件合成的裸 Enter：放行，避免二次拦截
			if (event.__dshHotkeysSynthetic === true) return
			if (recording) return // 录制态：让录制监听器接管

			// 1) 扩展注册表动作（后期新增快捷键走这里）
			for (const action of Object.values(KEYMAP)) {
				if (matchCombo(event, action.combo)) {
					action.handler(event)
					return
				}
			}

			// 2) 「自定义答案」输入框专用路由：与 composer 的 send/newline 语义无关
			const customField = customAnswerFieldFrom(event.target)
			if (customField) {
				handleCustomAnswerKey(event, bindings, customField)
				return
			}

			if (event.key !== 'Enter') return

			const sendCombo = parseCombo(bindings.send)
			const newlineCombo = bindings.newline ? parseCombo(bindings.newline) : null

			// send 绑定匹配
			if (matchCombo(event, sendCombo)) {
				if (isComposing(event) || !isEditableTarget(event.target) || hasOpenOverlay()) return
				if (isDshSendGesture(event)) return // 本身就是 DSH 发送手势：放行
				// 自定义的发送键（非 Enter 手势）：拦截并合成 Enter
				event.preventDefault()
				event.stopImmediatePropagation()
				dispatchEnter(event.target)
				return
			}

			// newline 绑定匹配
			if (newlineCombo && matchCombo(event, newlineCombo)) {
				if (isComposing(event) || !isEditableTarget(event.target) || hasOpenOverlay()) return
				event.preventDefault()
				event.stopImmediatePropagation()
				insertTextAtCaret(event.target, '\n')
				return
			}

			// 其余 Enter 组合（如 Shift+Enter、Alt+Enter）：放行给 DSH 内置行为
		}

		// ---------------------------------------------------------------------------
		// 轻量提示（纯 DOM，不依赖 React；插件自身的设置交互用）
		// ---------------------------------------------------------------------------

		let toastEl = null
		let toastTimer = 0
		function toast(message) {
			try {
				if (!toastEl) {
					toastEl = document.createElement('div')
					toastEl.style.cssText = 'position:fixed;top:12px;left:50%;transform:translateX(-50%);z-index:2147483000;' +
						'background:rgba(20,22,28,.92);color:#fff;padding:8px 16px;border-radius:8px;' +
						'font:13px/1.5 system-ui,sans-serif;box-shadow:0 4px 16px rgba(0,0,0,.3);pointer-events:none;'
					document.body.appendChild(toastEl)
				}
				toastEl.textContent = message
				toastEl.style.display = 'block'
				clearTimeout(toastTimer)
				toastTimer = setTimeout(() => { if (toastEl) toastEl.style.display = 'none' }, 2600)
			} catch {
				// 提示失败不影响核心功能
			}
		}

		// ---------------------------------------------------------------------------
		// /hotkeys 命令与录制
		// ---------------------------------------------------------------------------

		/** 进入录制态：监听下一个组合键并绑定到 role（send/newline/customAnswerSubmit）。 */
		const ROLE_LABEL = { send: '发送', newline: '换行', customAnswerSubmit: '自定义答案提交' }
		let recording = false
		function recordBinding(role, api) {
			if (recording) return
			recording = true
			const timeout = setTimeout(() => {
				document.removeEventListener('keydown', handler, { capture: true })
				recording = false
				toast('录制超时，已取消')
			}, 15000)
			const handler = (event) => {
				clearTimeout(timeout)
				recording = false
				document.removeEventListener('keydown', handler, { capture: true })
				if (event.key === 'Escape') {
					toast('已取消录制')
					return
				}
				const combo = describeCombo(event)
				if (!combo) {
					toast('请同时按下组合键（如 Ctrl+Shift+Enter）')
					document.addEventListener('keydown', handler, { capture: true })
					recording = true
					return
				}
				event.preventDefault()
				event.stopImmediatePropagation()
				api.setBinding(role, combo)
				toast(`「${ROLE_LABEL[role] || role}」键已设为 ${combo}`)
			}
			document.addEventListener('keydown', handler, { capture: true })
			toast(`请按下新的「${ROLE_LABEL[role] || role}」组合键（Esc 取消）`)
		}

		function registerHotkeysCommand(commandUi, api) {
			return commandUi.register({
				name: 'hotkeys',
				description: '自定义发送/换行/自定义答案提交快捷键：预设、录制、查看当前绑定',
				available: () => true,
				ui: {
					kind: 'popupSelect',
					options: async () => {
						const b = api.getBindings()
						return [
							...Object.entries(PRESETS).map(([id, p]) => ({
								id: `preset:${id}`,
								label: p.label,
								detail: `send=${b.send} · newline=${b.newline || '（不拦截）'}`,
							})),
							{ id: 'record:send', label: '🎙 录制「发送」键' },
							{ id: 'record:newline', label: '🎙 录制「换行」键' },
							{ id: 'record:customAnswerSubmit', label: `🎙 录制「自定义答案提交」键（当前 ${b.customAnswerSubmit || 'Enter'}）` },
						]
					},
					onSelect: (option) => {
						if (!option) return
						if (option.id.startsWith('preset:')) {
							const preset = PRESETS[option.id.slice(7)]
							if (preset) {
								api.setPreset(option.id.slice(7))
								toast(`已应用：${preset.label}`)
							}
						} else if (option.id === 'record:send') {
							recordBinding('send', api)
						} else if (option.id === 'record:newline') {
							recordBinding('newline', api)
						} else if (option.id === 'record:customAnswerSubmit') {
							recordBinding('customAnswerSubmit', api)
						}
					},
				},
			})
		}

		// ---------------------------------------------------------------------------
		// 插件装配
		// ---------------------------------------------------------------------------

		exports.apply = function(ctx) {
			ctx.effect(() => {
				const config = loadConfig()

				/** 公开接口：供 /hotkeys 命令、控制台与后期 UI 调用。 */
				const api = {
					getBindings: () => ({ ...config.bindings }),
					getConfig: () => ({ bindings: { ...config.bindings } }),
					/** role: 'send' | 'newline' | 'customAnswerSubmit'；combo: 组合键字符串（'' 表示不拦截） */
					setBinding(role, combo) {
						if (role !== 'send' && role !== 'newline' && role !== 'customAnswerSubmit') throw new Error(`dsh-hotkeys: role 必须是 send / newline / customAnswerSubmit，收到 ${role}`)
						config.bindings[role] = String(combo || '')
						saveConfig(config)
					},
					setPreset(id) {
						const preset = PRESETS[id]
						if (!preset) throw new Error(`dsh-hotkeys: 未知预设 ${id}`)
						// 预设只定义 send/newline；customAnswerSubmit 是独立、可随时切换的键，切预设时保留
						config.bindings = { ...preset.bindings, customAnswerSubmit: config.bindings.customAnswerSubmit ?? 'Enter' }
						saveConfig(config)
					},
					features: () => Object.keys(KEYMAP),
				}

				const onKeyDown = (event) => handleKeyDown(event, config.bindings)
				document.addEventListener('keydown', onKeyDown, { capture: true })

				let disposeCommand = () => {}
				try {
					const commandUi = ctx.get('commandUi')
					if (commandUi && typeof commandUi.register === 'function') {
						disposeCommand = registerHotkeysCommand(commandUi, api)
					}
				} catch {
					// commandUi 不可用：核心的键位拦截不受影响
				}

				try {
					window.__dshHotkeys = api
				} catch {
					// 非浏览器环境忽略
				}

				return () => {
					document.removeEventListener('keydown', onKeyDown, { capture: true })
					disposeCommand()
					try {
						if (window.__dshHotkeys === api) delete window.__dshHotkeys
					} catch {
						// 忽略
					}
				}
			})
		}

		return module.exports;
	}
});
