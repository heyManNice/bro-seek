import React, { useState, useCallback, useEffect, useRef } from 'react'
import { type ChatMessage } from '@/types'
import { Copy, ThumbsUp, ThumbsDown, Check } from 'lucide-react'

/**
 * MessageBubble 组件 - 聊天消息
 * ChatGPT 风格：
 * - 用户消息：右对齐、简洁圆角气泡
 * - 助手消息：左对齐、无气泡背景、完成后显示反馈按钮
 * - 收到对方反应时触发暴击动画
 */
interface MessageBubbleProps {
    message: ChatMessage
    isRemoteTyping: boolean
    isLastAssistantMsg: boolean
    /** 是否是对方（assistant）的最后一条完整消息（非流式中） */
    isCompletedAssistantMsg: boolean
    /** 发送反应回调 */
    onReaction?: (msgId: string, type: 'up' | 'down') => void
}

/** 反应弹出飞出的条目 */
interface FlyingReaction {
    id: number
    emoji: string
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
    message,
    isRemoteTyping,
    isLastAssistantMsg,
    isCompletedAssistantMsg,
    onReaction,
}) => {
    const isUser = message.role === 'user'
    const isAssistant = message.role === 'assistant'
    const isSystem = message.role === 'system'

    // ===== 暴击动画检测 =====
    const prevTotalRef = useRef(0)
    const [hitActive, setHitActive] = useState(false)
    const [flyingReactions, setFlyingReactions] = useState<FlyingReaction[]>([])
    const flyIdRef = useRef(0)

    useEffect(() => {
        const total = message.reactions.thumbsUp + message.reactions.thumbsDown
        if (total > prevTotalRef.current) {
            // 新增了反应 → 触发暴击
            setHitActive(true)
            setTimeout(() => setHitActive(false), 400)

            // 弹出飞出动画
            const lastType = message.reactions.thumbsUp > message.reactions.thumbsDown ? '👍' : '👎'
            const id = ++flyIdRef.current
            setFlyingReactions((prev) => [...prev, { id, emoji: lastType }])
            setTimeout(() => {
                setFlyingReactions((prev) => prev.filter((r) => r.id !== id))
            }, 900)
        }
        prevTotalRef.current = total
    }, [message.reactions.thumbsUp, message.reactions.thumbsDown])

    // ===== 复制功能 =====
    const [copied, setCopied] = useState(false)
    const handleCopy = useCallback(() => {
        navigator.clipboard.writeText(message.content).then(() => {
            setCopied(true)
            setTimeout(() => setCopied(false), 1500)
        })
    }, [message.content])

    // ===== 系统消息 =====
    if (isSystem) {
        return (
            <div className="flex justify-center py-2">
                <span className="text-xs text-text-tertiary bg-surface border border-line px-3 py-1 rounded-full font-mono">
                    {message.content}
                </span>
            </div>
        )
    }

    // ===== 用户消息 - 右对齐、简洁气泡 =====
    if (isUser) {
        return (
            <div className="animate-fade-in">
                <div className="max-w-3xl mx-auto w-full px-4 py-1.5 flex justify-end">
                    <div
                        className="
                            max-w-[80%] px-4 py-2.5
                            rounded-3xl rounded-br-lg
                            text-sm leading-relaxed whitespace-pre-wrap break-words
                            text-text-primary
                        "
                        style={{ backgroundColor: 'color-mix(in srgb, var(--text-primary) 8%, transparent)' }}
                    >
                        {message.content}
                    </div>
                </div>
            </div>
        )
    }

    // ===== 助手消息 - 左对齐、无气泡 =====
    return (
        <div className={`animate-fade-in relative ${hitActive ? 'reaction-hit' : ''}`}>
            <div className="max-w-3xl mx-auto w-full px-4 py-1.5 relative">
                {/* 消息文本 */}
                <div
                    className={`
                        text-sm leading-relaxed whitespace-pre-wrap break-words
                        text-text-primary
                        ${message.isStreaming && isLastAssistantMsg ? 'typing-cursor' : ''}
                    `}
                >
                    {message.content}
                    {/* 空消息占位 */}
                    {message.isStreaming && message.content.length === 0 && isLastAssistantMsg && (
                        <span className="typing-cursor" />
                    )}
                </div>

                {/* Tokens 正在生成中 */}
                {isLastAssistantMsg && isRemoteTyping && !message.isStreaming && (
                    <div className="flex items-center gap-2 mt-1.5 text-xs text-text-tertiary">
                        <div className="dot-pulse">
                            <span />
                            <span />
                            <span />
                        </div>
                        <span>Tokens 正在生成中...</span>
                    </div>
                )}

                {/* ===== 操作按钮：完成后显示 ===== */}
                {isCompletedAssistantMsg && message.content.length > 0 && (
                    <div className="flex items-center gap-1 mt-2 -ml-1">
                        {/* 复制 */}
                        <button
                            onClick={handleCopy}
                            className="
                                p-1.5 rounded-lg
                                text-text-tertiary hover:text-text-secondary
                                hover:bg-surface-hover
                                transition-colors duration-150
                            "
                            title="复制"
                        >
                            {copied ? <Check size={14} /> : <Copy size={14} />}
                        </button>

                        {/* 点赞 */}
                        <button
                            onClick={() => onReaction?.(message.remoteMsgId || message.id, 'up')}
                            className="
                                p-1.5 rounded-lg
                                text-text-tertiary hover:text-text-secondary
                                hover:bg-surface-hover
                                transition-colors duration-150
                                flex items-center gap-1
                            "
                            title="有帮助"
                        >
                            <ThumbsUp size={14} />
                            {message.reactions.thumbsUp > 0 && (
                                <span className="text-[10px] font-mono text-text-secondary">
                                    {message.reactions.thumbsUp}
                                </span>
                            )}
                        </button>

                        {/* 点踩 */}
                        <button
                            onClick={() => onReaction?.(message.remoteMsgId || message.id, 'down')}
                            className="
                                p-1.5 rounded-lg
                                text-text-tertiary hover:text-text-secondary
                                hover:bg-surface-hover
                                transition-colors duration-150
                                flex items-center gap-1
                            "
                            title="没帮助"
                        >
                            <ThumbsDown size={14} />
                            {message.reactions.thumbsDown > 0 && (
                                <span className="text-[10px] font-mono text-text-secondary">
                                    {message.reactions.thumbsDown}
                                </span>
                            )}
                        </button>
                    </div>
                )}

                {/* ===== 暴击飞出动画 ===== */}
                {flyingReactions.map((fr) => (
                    <div
                        key={fr.id}
                        className="
                            reaction-number-fly
                            absolute top-0 left-12
                            text-2xl pointer-events-none select-none
                            z-10
                        "
                    >
                        {fr.emoji}
                    </div>
                ))}
            </div>
        </div>
    )
}

export default MessageBubble
