import React, { useEffect, useRef } from 'react'
import { Handshake, ChevronDown, Gift, Share2, MoreHorizontal } from 'lucide-react'
import { ConnectionStatus, type ChatMessage } from '@/types'
import MessageBubble from './MessageBubble'

/**
 * ChatView 组件 - 聊天主视窗
 * ChatGPT 风格：无顶栏、居中欢迎、干净的消息列表
 */
interface ChatViewProps {
    messages: ChatMessage[]
    remoteModelName: string
    isRemoteTyping: boolean
    connectionStatus: ConnectionStatus
    /** 发送反应回调 */
    onReaction?: (msgId: string, type: 'up' | 'down') => void
}

const ChatView: React.FC<ChatViewProps> = ({
    messages,
    remoteModelName,
    isRemoteTyping,
    connectionStatus,
    onReaction,
}) => {
    const scrollContainerRef = useRef<HTMLDivElement>(null)

    // ===== 自动滚动到底部 =====
    useEffect(() => {
        const container = scrollContainerRef.current
        if (container) {
            container.scrollTop = container.scrollHeight
        }
    }, [messages, isRemoteTyping])

    const isConnected = connectionStatus === ConnectionStatus.Connected
    const isWaiting = connectionStatus === ConnectionStatus.Waiting

    // ===== 计算最后一条已完成的 assistant 消息 index =====
    const lastCompletedAssistantIdx = (() => {
        for (let i = messages.length - 1; i >= 0; i--) {
            if (messages[i].role === 'assistant' && !messages[i].isStreaming) {
                return i
            }
        }
        return -1
    })()

    return (
        <div className="flex-1 flex flex-col h-full min-w-0">
            {/* ===== 顶栏：模型名称 + 操作按钮 ===== */}
            <div className="flex items-center justify-between px-4 py-2.5 shrink-0">
                {/* 左侧：模型名称 */}
                <div className="flex items-center gap-1.5">
                    <span className="text-sm font-semibold text-text-primary">
                        {remoteModelName}
                    </span>
                    <ChevronDown size={14} className="text-text-tertiary" />
                </div>
                {/* 右侧：占位操作按钮 */}
                <div className="flex items-center gap-1">
                    <button
                        className="
                            px-3 py-1.5 rounded-lg text-xs font-medium
                            text-text-secondary hover:text-text-primary
                            hover:bg-surface-hover
                            transition-colors duration-150
                            flex items-center gap-1.5
                        "
                    >
                        <Gift size={14} />
                        <span className="hidden sm:inline">Free offer</span>
                    </button>
                    <button
                        className="
                            px-3 py-1.5 rounded-lg text-xs font-medium
                            text-text-secondary hover:text-text-primary
                            hover:bg-surface-hover
                            transition-colors duration-150
                            flex items-center gap-1.5
                        "
                    >
                        <Share2 size={14} />
                        <span className="hidden sm:inline">Share</span>
                    </button>
                    <button
                        className="
                            w-8 h-8 rounded-lg
                            text-text-secondary hover:text-text-primary
                            hover:bg-surface-hover
                            flex items-center justify-center
                            transition-colors duration-150
                        "
                    >
                        <MoreHorizontal size={16} />
                    </button>
                </div>
            </div>

            {/* 消息列表区域 */}
            <div
                ref={scrollContainerRef}
                className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth"
            >
                {/* ===== 空状态 / 欢迎界面 ===== */}
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full px-4 text-center">
                        {/* Logo 图标 */}
                        <div
                            className="
                                w-16 h-16 rounded-2xl
                                bg-surface border border-line
                                flex items-center justify-center
                                mb-6 shadow-sm
                            "
                        >
                            <Handshake size={32} className="text-text-secondary" strokeWidth={1.5} />
                        </div>

                        <h2 className="text-xl font-semibold text-text-primary mb-2">
                            {isWaiting
                                ? '等待你的 Bro 连接...'
                                : isConnected
                                    ? '已连接！开始和你的 Bro 聊天吧'
                                    : '欢迎使用 BroSeek'}
                        </h2>
                        <p className="text-sm text-text-secondary max-w-md leading-relaxed">
                            {isWaiting
                                ? '复制你的 API Key 分享给对方，或者等待对方输入你的 API Key 来建立 P2P 连接。'
                                : isConnected
                                    ? '在这里，没有硅基 AI，只有你的碳基好兄弟。你每打一个字，对方都会实时看到。'
                                    : '点击齿轮图标进入设置，你可以生成 API Key 等待 Bro 连接，或输入 Bro 的 API Key 主动连接。'}
                        </p>

                        {/* 等待连接时的动画 */}
                        {isWaiting && (
                            <div className="flex items-center gap-2 mt-6 text-text-tertiary">
                                <div className="dot-pulse">
                                    <span />
                                    <span />
                                    <span />
                                </div>
                                <span className="text-xs font-mono">等待 P2P 握手...</span>
                            </div>
                        )}
                    </div>
                )}

                {/* ===== 消息列表 ===== */}
                {messages.map((msg, index) => (
                    <MessageBubble
                        key={msg.id}
                        message={msg}
                        isRemoteTyping={isRemoteTyping}
                        isLastAssistantMsg={
                            msg.role === 'assistant' &&
                            index ===
                            messages
                                .map((m, i) => (m.role === 'assistant' ? i : -1))
                                .filter((i) => i !== -1)
                                .pop()
                        }
                        isCompletedAssistantMsg={index === lastCompletedAssistantIdx}
                        onReaction={onReaction}
                    />
                ))}

                {/* ===== 对方正在打字但还没有实际消息时的指示器 ===== */}
                {isRemoteTyping &&
                    !messages.some((m) => m.role === 'assistant' && m.isStreaming) && (
                        <div className="flex items-center gap-2 px-4 py-1.5 max-w-3xl mx-auto w-full">
                            <div className="flex items-center gap-2 text-sm text-text-secondary">
                                <div className="dot-pulse">
                                    <span />
                                    <span />
                                    <span />
                                </div>
                                <span>Tokens 正在生成中...</span>
                            </div>
                        </div>
                    )}
            </div>
        </div>
    )
}

export default ChatView
