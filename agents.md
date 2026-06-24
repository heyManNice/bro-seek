# BroSeek 🚀

> **"Don't seek AI, seek your Bro."**
> 一个伪装成次世代 AI 聊天助手（如 DeepSeek/ChatGPT）的**纯前端去中心化 P2P 极客聊天室**。
> 本项目为 **Pure Frontend（纯前端）** 架构，无任何后端服务器依赖，完全基于浏览器点对点通信。

---

## 📋 项目状态

| 项目 | 状态 |
| :--- | :--- |
| 技术栈 | Vite 6 + React 18 + TypeScript + Tailwind CSS 3 + PeerJS 1.5 |
| 开发阶段 | v0.1.0 - MVP 完成 ✅ |
| 运行方式 | `npm run dev` → http://localhost:3000 |

---

## 🗂️ 项目结构

```
bro-seek/
├── index.html                  # HTML 入口
├── package.json                # 依赖配置
├── tsconfig.json               # TypeScript 配置
├── vite.config.ts              # Vite 配置 + @ 别名
├── tailwind.config.js          # Tailwind 暗色主题配置
├── postcss.config.js           # PostCSS 配置
├── agents.md                   # 项目文档（本文件）
└── src/
    ├── main.tsx                # React 入口
    ├── App.tsx                 # 主组件 - 布局组合
    ├── index.css               # 全局样式 + Tailwind + 动画
    ├── vite-env.d.ts           # Vite 类型声明
    ├── types/
    │   └── index.ts            # 核心类型定义（ConnectionStatus, Message, Payload 等）
    ├── utils/
    │   ├── apiKey.ts           # API Key 编解码（sk-broseek-{base64}）
    │   └── peer.ts             # PeerJS 工具函数 + DataChannel 发送封装
    ├── hooks/
    │   └── usePeerConnection.ts # 核心 Hook - P2P 连接全生命周期管理
    └── components/
        ├── Sidebar.tsx          # 左侧栏 - Logo/状态/重置上下文
        ├── ChatView.tsx         # 聊天主视窗 - 消息列表 + 欢迎页
        ├── MessageBubble.tsx    # 消息气泡 - user/assistant/system 样式
        ├── InputArea.tsx        # 输入区 - 字符级流式发送核心
        └── SettingsModal.tsx    # 设置弹窗 - API Key / Model 选择
```

---

## 🚀 快速开始

```bash
# 1. 安装依赖
npm install

# 2. 启动开发服务器
npm run dev

# 3. 在两个浏览器窗口/标签页中打开 http://localhost:3000
#    一端点击"生成 API Key 并等待连接"（Host）
#    另一端在设置中输入对方的 API Key 并连接（Client）
```

---

## 🔧 已实现的核心功能

1. **伪 API Key 系统** - Peer ID 通过 Base64 编码包装为 `sk-broseek-xxx` 格式
2. **P2P 双向连接** - 基于 PeerJS + WebRTC DataChannel，Host/Client 双模式
3. **字符级实时流式输出** ⚡ - 监听每个按键，逐字通过 DataChannel 发送
4. **中文输入法支持** - compositionstart/end 事件处理，完整支持 IME
5. **粘贴支持** - 粘贴大量文本时逐字流式发送
6. **"Tokens 正在生成中..."** - 对端打字时的实时状态指示
7. **模型名称自定义** - 预设搞笑模型名 + 自定义输入
8. **重置上下文** - 双端同步清空聊天记录
9. **暗色主题 UI** - 高仿 DeepSeek 界面风格

---

## 💡 项目世界观 (The Vibe)

现在大模型聊天软件非常火爆，但 **BroSeek** 决定反其道而行之：
它的 UI 界面和当下的主流大模型对话客户端一模一样，需要用户填写 “API Key” 并选择 “Model”。但实际上，**这里没有硅基 AI，只有你的碳基好兄弟（Bro）。**

当你输入所谓的 API Key 时，浏览器其实是在建立一条 WebRTC P2P 直连通道；当你看到屏幕上“流式输出（Streaming）”逐字蹦出文字时，那是你的兄弟在键盘上实时敲击。

---

## 🎯 VibeCoding 核心目标与技术映射

请 AI 编码助手严格按照以下纯前端技术设计进行全自动代码生成。

### 1. 概念与前端技术映射表 (Mapping Rules)

| 前端 UI 概念 | 纯前端底层技术实现 | 业务逻辑与交互说明 |
| :--- | :--- | :--- |
| **API Key** | `WebRTC Peer ID` | 实际上是 PeerJS 自动生成的唯一的 ID（或加上混淆信息后的 Base64 字符串）。例如：`sk-broseek-YnJvMTIzNA==` |
| **Model Name** | `对端节点自定义备注` | 用户可在前端任意修改。例如：`BroSeek-R1 (深度思考中)`、`BroSeek-Lite (已喝高版)` |
| **Streaming Output** | `WebRTC DataChannel 实时字符流` | **核心体验：** 拒绝传统按回车发送全段！监听 `textarea` 的 `input` 或 `keydown` 事件，对方每打一个字，立刻通过 DataChannel 发送并实时渲染到对端屏幕 |
| **Tokens Generating...**| `对端打字状态 (Typing)` | 监测到对端正在输入字符流时，本端界面显示 “Tokens 正在生成中...” |
| **Reset Context** | `清空本地 DOM 节点 / 缓存` | 纯本地操作，清空当前聊天窗口的 HTML 渲染记录 |

---

## 🛠️ 纯前端技术栈建议 (Tech Stack)

* **核心框架**：HTML5 / CSS3 / JavaScript (或者 Vite + Vue3 / React 以便快速搭建漂亮的 AI 界面)
* **P2P 通信库**：`PeerJS` (极其适合前端的 WebRTC 封装库，利用公共的 PeerJS 云信令服务器交换握手信息，之后两台电脑直接 P2P 连接)
* **UI 风格**：高仿 DeepSeek 或 ChatGPT。左边是对话历史列表，右边是聊天主视窗，顶部有模型选择器，设置里有填写 API Key 的输入框。

---

## 🔄 核心业务流 (Core Flow)

1. **宿主端（Host）- 生成 Key**：
   * 浏览器打开网页，PeerJS 自动向信令服务器注册并获取一个 `Peer ID`。
   * 前端将该 ID 加上 `sk-broseek-` 前缀（可选择进行 Base64 编码）展现给用户。这就是你的 **“API Key”**。
   * 宿主端进入等待连接状态。

2. **客户端（Client）- 填入 Key 建立连接**：
   * 另一个好兄弟打开网页，在“API 设置”中输入对方分享的 “API Key”。
   * 前端解码提取出真实的 `Peer ID`，调用 `peer.connect(peerId)` 发起 WebRTC 连接。
   * 连接成功，UI 提示：`[Success] Base model connected successfully.`

3. **双向流式对位（Streaming Communication）**：
   * 双方进入聊天界面。
   * 任意一方在输入框中打字时，前端监听每一次按键，将最新的字符差量实时通过 `dataChannel.send()` 发送出去。
   * 接收端收到字符后，立刻追加到当前的对话气泡中，完美模拟大模型的 Stream 流式输出。

---

## 📝 VibeCoding 专属 Prompt 提示词

你可以直接将上面这段需求喂给你的 AI 助手，并附上以下指令：

> “请仔细阅读上面的需求。我们现在要开发一个名为 **BroSeek** 的纯前端 P2P 聊天项目。请使用Tailwind CSS 和原生 ts 结合 Vite+React，引入 `peerjs` 库来实现。请确保完美实现将 Peer ID 包装成伪 API Key、以及‘字符按键级实时流式输出（Streaming）’的核心功能。现在，请一步一步引导我建立项目并生成代码。”