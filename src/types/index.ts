/**
 * BroSeek 核心类型定义
 */

/** 连接状态枚举 */
export enum ConnectionStatus {
    /** 空闲 - 未连接，未等待 */
    Idle = 'idle',
    /** 等待中 - Host 端等待对方连接 */
    Waiting = 'waiting',
    /** 连接中 - Client 端正在尝试连接 */
    Connecting = 'connecting',
    /** 已连接 */
    Connected = 'connected',
    /** 连接失败/断开 */
    Disconnected = 'disconnected',
}

/** 消息角色（模拟 AI 对话） */
export enum MessageRole {
    /** 你发送的消息（用户） */
    User = 'user',
    /** 对方发来的消息（Bro / "AI 助手"） */
    Assistant = 'assistant',
    /** 系统消息 */
    System = 'system',
}

/** 消息反应计数 */
export interface MessageReactions {
    thumbsUp: number
    thumbsDown: number
}

/** 聊天消息 */
export interface ChatMessage {
    id: string
    role: MessageRole
    content: string
    timestamp: number
    /** 消息是否仍在流式接收中 */
    isStreaming: boolean
    /** 反应计数（点赞/踩） */
    reactions: MessageReactions
    /** 对端原始消息 ID（用于反应匹配） */
    remoteMsgId?: string
    /** 对端反应版本号（每次对端发来反应时递增，用于触发本地动画） */
    remoteReactionVersion?: number
}

/** 对话会话 */
export interface Conversation {
    id: string
    title: string
    modelName: string
    messages: ChatMessage[]
    createdAt: number
    updatedAt: number
}

/** PeerJS 数据传输类型 */
export enum DataAction {
    /** 流式字符追加 */
    StreamChar = 'stream_char',
    /** 流式发送完成（对方按了发送/回车） */
    StreamEnd = 'stream_end',
    /** 删除最后一个字符（退格） */
    Backspace = 'backspace',
    /** 打字中状态通知 */
    Typing = 'typing',
    /** 停止打字 */
    TypingStop = 'typing_stop',
    /** 清除上下文 */
    ResetContext = 'reset_context',
    /** 发送模型名称给对方 */
    ModelName = 'model_name',
    /** 发送反应（点赞/踩） */
    Reaction = 'reaction',
}

/** DataChannel 传输的载荷 */
export interface DataPayload {
    action: DataAction
    /** 字符内容（StreamChar 时使用） */
    char?: string
    /** 消息内容（StreamEnd 时使用，完整消息文本） */
    content?: string
    /** 模型名称 */
    modelName?: string
    /** 删除次数（Backspace 时使用，连续退格可批量） */
    deleteCount?: number
    /** 发送端原始消息 ID（StreamChar 时携带，用于对端反应匹配） */
    senderMsgId?: string
    /** 目标消息 ID（Reaction 时使用） */
    targetMsgId?: string
    /** 反应类型：'up' | 'down'（Reaction 时使用） */
    reactionType?: 'up' | 'down'
}

/** 应用全局状态 */
export interface AppState {
    /** 当前连接状态 */
    connectionStatus: ConnectionStatus
    /** 本地 Peer ID */
    localPeerId: string | null
    /** 伪装的 API Key（sk-broseek-xxx） */
    pseudoApiKey: string | null
    /** 对方的 Peer ID */
    remotePeerId: string | null
    /** 本地模型名称（自己给对方看到的） */
    localModelName: string
    /** 对方模型名称（对方给自己看到的） */
    remoteModelName: string
    /** 对方是否正在打字 */
    isRemoteTyping: boolean
}
