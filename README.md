# 🤝 BroSeek

> **Don't seek AI, seek your Bro.**

一个伪装成次世代 AI 聊天助手（如 DeepSeek / ChatGPT）的**纯前端去中心化 P2P 极客聊天室**。

> ⚠️ **免责声明：本项目 100% 由 AI VibeCoding 生成**——从第一行代码到这份 README，全部由 AI 自主编写完成。人类只负责提出想法和验收结果。

<p align="center">
  <img src="https://img.shields.io/badge/version-0.1.0-blue" alt="version" />
  <img src="https://img.shields.io/badge/100%25-VibeCoding-brightgreen" alt="vibecoding" />
  <img src="https://img.shields.io/badge/zero-backend-orange" alt="zero backend" />
  <img src="https://img.shields.io/badge/license-MIT-lightgrey" alt="license" />
</p>

---

## 📸 效果预览

```
┌──────────────────────────────────────────────────────────┐
│  ☰  BroSeek                                   ⚙️ 🌙    │
├──────────┬───────────────────────────────────────────────┤
│          │                                               │
│  📄 新对话 │   BroSeek-R1 (深度思考中)            ▾  ···  │
│          │                                               │
│          │   🤖 你好，有什么可以帮你的？                  │
│          │                                               │
│          │   👤 帮我写一段 React 组件                     │
│          │                                               │
│          │   🤖 [流式输出中...]                            │
│          │                                               │
│          ├───────────────────────────────────────────────┤
│ ● 已连接  │  给 Bro 发消息...                        ➤   │
│          │  实时流式传输中 · 每个按键都会即时发送给 Bro     │
└──────────┴───────────────────────────────────────────────┘
```

## ✨ 核心特性

| 特性 | 说明 |
|:---|:---|
| 🎭 **伪 API Key** | PeerJS ID 通过 Base64 编码包装为 `sk-broseek-xxx` 格式，完美伪装 |
| 🔗 **P2P 直连** | 基于 WebRTC DataChannel，零服务器依赖，延迟极低 |
| ⚡ **字符级流式输出** | 监听每个按键，逐字实时发送到对端，完美模拟 LLM Streaming |
| 🇨🇳 **中文输入法支持** | compositionstart/end 事件处理，完整支持 IME |
| 📋 **粘贴支持** | 粘贴大量文本时自动逐字流式发送 |
| ⏳ **实时状态** | 对端正在打字时显示 "Tokens 正在生成中..." |
| 🎯 **消息反应** | ThumbsUp / ThumbsDown 反应系统，带飞入动画 |
| 🌙 **暗色主题** | 高仿 DeepSeek 风格 UI，CSS 变量主题切换 |
| 📱 **移动端适配** | 响应式布局，移动端抽屉式侧边栏 |
| 💾 **设置持久化** | 模型名称通过 localStorage 自动保存 |

## 🛠️ 技术栈

```
前端框架:    React 18 + TypeScript 5
构建工具:    Vite 6
样式方案:    Tailwind CSS 3
P2P 通信:   PeerJS (WebRTC 封装)
图标库:     Lucide React
预渲染:     Playwright (Headless Chromium)
字体:       HarmonyOS Sans SC
```

## 🚀 快速开始

### 环境要求

- Node.js >= 18
- npm / pnpm / yarn

### 安装与运行

```bash
# 克隆仓库
git clone https://github.com/your-username/bro-seek.git
cd bro-seek

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

### 连接方式

1. 在浏览器中打开 `http://localhost:5173`
2. **宿主端（Host）**：点击齿轮图标 → 生成 API Key → 将 `sk-broseek-xxx` 分享给你的 Bro
3. **客户端（Client）**：点击齿轮图标 → 输入对方的 API Key → 连接
4. 开始聊天！你的每一次按键都会实时传送到对方屏幕 🚀

## 📦 构建部署

```bash
# 生产构建
npm run build

# 构建 + 预渲染（需要 Playwright）
npx playwright install --with-deps chromium
npm run prerender

# 预览构建产物
npm run preview
```

## 📁 项目结构

```
bro-seek/
├── index.html                  # HTML 入口
├── package.json                # 依赖配置
├── tsconfig.json               # TypeScript 配置
├── vite.config.ts              # Vite 配置
├── tailwind.config.js          # Tailwind 暗色主题
├── tools/
│   └── prerender.ts            # Playwright 预渲染脚本
└── src/
    ├── main.tsx                # React 入口
    ├── App.tsx                 # 主组件 - 布局组合
    ├── index.css               # 全局样式 + 动画
    ├── types/
    │   └── index.ts            # 核心类型定义
    ├── utils/
    │   ├── apiKey.ts           # API Key 编解码
    │   └── peer.ts             # PeerJS 工具函数
    ├── contexts/
    │   └── ThemeContext.tsx     # 主题上下文
    ├── hooks/
    │   └── usePeerConnection.ts # P2P 连接核心 Hook
    └── components/
        ├── Sidebar.tsx          # 侧边栏
        ├── ChatView.tsx         # 聊天主视窗
        ├── MessageBubble.tsx    # 消息气泡
        ├── InputArea.tsx        # 输入区域
        └── SettingsModal.tsx    # 设置弹窗
```

## 🏗️ 架构设计

```
┌─────────────────────────────────────────────┐
│                  App.tsx                     │
│  ┌──────────┐  ┌──────────────────────────┐ │
│  │ Sidebar  │  │        ChatView          │ │
│  │          │  │  ┌────────────────────┐  │ │
│  │ • 状态   │  │  │    MessageBubble   │  │ │
│  │ • 对话   │  │  │  (user/assistant)  │  │ │
│  │ • 设置   │  │  └────────────────────┘  │ │
│  └──────────┘  ├──────────────────────────┤ │
│                │       InputArea           │ │
│                │  (居中 ↔ 底部 动态切换)    │ │
│                └──────────────────────────┘ │
└──────────────────────┬──────────────────────┘
                       │
              usePeerConnection Hook
                       │
                ┌──────┴──────┐
                │  PeerJS     │
                │  WebRTC     │
                │  DataChannel│
                └─────────────┘
```

## 🔒 隐私与安全

- **零服务器**：所有通信基于 WebRTC P2P 直连，数据不经过任何第三方服务器
- **无数据存储**：聊天记录仅存在于浏览器内存中，刷新即清空
- **开放信令**：PeerJS 公共信令服务器仅用于初始握手，连接建立后完全点对点

## 📄 License

[MIT](LICENSE) © BroSeek

---

<p align="center">
  <sub>Built with ❤️ by AI, for humans.</sub>
</p>
