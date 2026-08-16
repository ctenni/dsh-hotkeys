# DSH Hotkeys

[中文](https://github.com/ctenni/dsh-hotkeys/blob/main/README.md) | **English**

Keyboard shortcut customization plugin for DeepSeek Harness (browser-side bundle plugin). Lets you record and switch the trigger keys for **send / newline / custom-answer submit**, config persisted in browser `localStorage`, no backend needed.

## ✨ Features

- ⌨️ **Hotkey recording**: trigger keys for send, newline, and custom-answer submit can all be recorded and switched anytime.
- 🚀 **Quick send**: bind "send" to any combo you like (Enter / Ctrl+Enter / F9, etc.).
- 🎨 **Custom answer enhancement**: customize the submit key of the "Type your answer" input in DeepSeek question cards (`ask_user_question`), with accidental-submit protection.
- 🛡️ **Enter-family leak guard**: when submit is bound to `Ctrl+Enter`/`Alt+Enter`, the other Enter combo no longer hijacks sending.

## 🤖 AI install

Hand the following prompt to your AI coding agent (DeepSeek / Claude, etc.) and it will install the plugin for you:

> Please install the `dsh-hotkeys` plugin into the DeepSeek Harness web profile: run `dsh plugin --profile web add dsh-hotkeys`, then restart `dsh web` and hard-refresh the browser (Ctrl+F5), then type `/hotkeys` in the message input to verify the menu appears, and run `window.__dshHotkeys.getBindings()` in the browser console to confirm the three binding fields are returned.

Full AI install instructions (manual method, troubleshooting, verification): **[AI_INSTALL.md](https://github.com/ctenni/dsh-hotkeys/blob/main/AI_INSTALL.md)**

## 📦 Installation

### Method 1: via `dsh plugin` (recommended, one command)

```powershell
dsh plugin --profile web add dsh-hotkeys
```

DSH will automatically: pnpm-install the package → detect the `dsh.bundle` declaration → add `dsh-hotkeys` to `dsh.profile.bundles` in `package.json`.

> Requires `pnpm`. If missing: `npm install -g pnpm`.

### Method 2: manual install (npm/pnpm)

```powershell
cd $env:USERPROFILE\.dsh\profiles\web   # Windows; macOS/Linux: cd ~/.dsh/profiles/web
pnpm add dsh-hotkeys
```

Then you **must** manually add `"dsh-hotkeys"` to the `dsh.profile.bundles` array in that directory's `package.json`:

```jsonc
"dsh": {
  "profile": {
    "bundles": [
      "@deepseek-ai/dsh-base",
      "@deepseek-ai/dsh-web-app",
      "dsh-hotkeys"        // ← required, otherwise it won't load
    ]
  }
}
```

> ⚠️ `pnpm add` does not touch the `bundles` list; DSH loads plugins from that list, so missing this line means it won't take effect.

### Method 3: GitHub repo + link (for development)

```powershell
git clone https://github.com/ctenni/dsh-hotkeys.git
```

Mount via `link:` in the web profile's `package.json`:

```jsonc
"dependencies": {
  "dsh-hotkeys": "link:C:/path/to/dsh-hotkeys"
}
```

You still need to add `"dsh-hotkeys"` to `bundles`.

> After any method: **restart `dsh web` + hard-refresh the browser (Ctrl+F5)**. Verify by typing `/hotkeys` (menu should appear) or running `window.__dshHotkeys.getBindings()` in the console.

## ⚙️ Usage

### Three customizable actions

| Action | Meaning | Default key |
| --- | --- | --- |
| `send` | Send in the composer (message input) | `Control+Enter` (safe preset) |
| `newline` | Insert a newline in the composer | `Enter` (safe preset) |
| `customAnswerSubmit` | Submit/continue in the "Type your answer" input of DeepSeek question cards | `Enter` |

## 📄 License

MIT License
