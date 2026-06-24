import React, {
    useState,
    useRef,
    useCallback,
    useEffect,
} from 'react'
import { Send } from 'lucide-react'
import { ConnectionStatus } from '@/types'

/**
 * InputArea 组件 - 消息输入区域
 * ChatGPT 风格：圆角输入框、无边框发送按钮
 * 核心功能：监听每一次按键，实时流式发送字符到对端
 * 支持中文 IME 输入法、退格删除、粘贴
 */
interface InputAreaProps {
    connectionStatus: ConnectionStatus
    onSendChar: (char: string) => void
    onSendDeleteChar: (count: number) => void
    onFinishMessage: () => void
    onTyping: () => void
    onTypingStop: () => void
}

const InputArea: React.FC<InputAreaProps> = ({
    connectionStatus,
    onSendChar,
    onSendDeleteChar,
    onFinishMessage,
    onTyping,
    onTypingStop,
}) => {
    const [inputValue, setInputValue] = useState('')
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    /**
     * 核心 Ref: 记录最后一次已同步到对端的文本快照。
     * 每次输入事件中，通过对比当前文本与快照的差异，
     * 精确计算新增/删除的字符，发送增量到对端。
     */
    const lastSyncedValueRef = useRef('')

    /** 打字通知防抖 */
    const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    /** 是否正处于 IME 输入法组合过程中 */
    const isComposingRef = useRef(false)

    const isConnected = connectionStatus === ConnectionStatus.Connected
    const isWaiting = connectionStatus === ConnectionStatus.Waiting

    // ===== 自动调整 textarea 高度 =====
    const adjustHeight = useCallback(() => {
        const el = textareaRef.current
        if (!el) return
        el.style.height = 'auto'
        el.style.height = `${Math.min(el.scrollHeight, 160)}px`
    }, [])

    /** 通知对端正在打字（带防抖） */
    const notifyTypingWithDebounce = useCallback(() => {
        onTyping()
        if (typingTimerRef.current) {
            clearTimeout(typingTimerRef.current)
        }
        typingTimerRef.current = setTimeout(() => {
            onTypingStop()
        }, 1500)
    }, [onTyping, onTypingStop])

    /**
     * 核心: 对比当前输入框文本与上次同步快照，计算增量/减量并发送
     */
    const syncDiffToPeer = useCallback(
        (currentValue: string) => {
            if (!isConnected) return

            const lastSynced = lastSyncedValueRef.current
            const currentLen = currentValue.length
            const lastLen = lastSynced.length

            if (currentLen === lastLen) return

            if (currentLen > lastLen) {
                let prefixLen = 0
                while (
                    prefixLen < lastLen &&
                    currentValue[prefixLen] === lastSynced[prefixLen]
                ) {
                    prefixLen++
                }
                const addedChars = currentValue.slice(prefixLen)
                for (const char of addedChars) {
                    onSendChar(char)
                }
            } else if (currentLen < lastLen) {
                let prefixLen = 0
                while (
                    prefixLen < currentLen &&
                    currentValue[prefixLen] === lastSynced[prefixLen]
                ) {
                    prefixLen++
                }
                const deletedCount = lastLen - prefixLen
                if (deletedCount > 0) {
                    onSendDeleteChar(deletedCount)
                }
            }

            lastSyncedValueRef.current = currentValue
            notifyTypingWithDebounce()
        },
        [isConnected, onSendChar, onSendDeleteChar, notifyTypingWithDebounce],
    )

    /** 处理输入事件 (onChange) */
    const handleChange = useCallback(
        (e: React.ChangeEvent<HTMLTextAreaElement>) => {
            const newValue = e.target.value

            if (isComposingRef.current) {
                setInputValue(newValue)
                adjustHeight()
                return
            }

            syncDiffToPeer(newValue)
            setInputValue(newValue)
            adjustHeight()
        },
        [syncDiffToPeer, adjustHeight],
    )

    /** 处理键盘事件（回车发送、Shift+Enter 换行） */
    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
            if (e.key === 'Enter' && !e.shiftKey && isConnected) {
                e.preventDefault()
                if (inputValue.trim().length === 0) return

                if (lastSyncedValueRef.current !== inputValue) {
                    syncDiffToPeer(inputValue)
                }

                onFinishMessage()
                setInputValue('')
                lastSyncedValueRef.current = ''
                onTypingStop()
                if (typingTimerRef.current) {
                    clearTimeout(typingTimerRef.current)
                }
                adjustHeight()
            }
        },
        [isConnected, inputValue, onFinishMessage, onTypingStop, syncDiffToPeer, adjustHeight],
    )

    /** 处理粘贴事件 */
    const handlePaste = useCallback(
        (e: React.ClipboardEvent) => {
            if (!isConnected) return
            e.preventDefault()
            const pastedText = e.clipboardData.getData('text/plain')
            if (!pastedText) return

            const textarea = textareaRef.current
            if (textarea) {
                const start = textarea.selectionStart
                const end = textarea.selectionEnd
                const newValue =
                    inputValue.slice(0, start) + pastedText + inputValue.slice(end)

                syncDiffToPeer(newValue)
                lastSyncedValueRef.current = newValue

                setInputValue(newValue)
                requestAnimationFrame(() => {
                    textarea.selectionStart = start + pastedText.length
                    textarea.selectionEnd = start + pastedText.length
                })
                adjustHeight()
            }

            notifyTypingWithDebounce()
        },
        [isConnected, inputValue, syncDiffToPeer, adjustHeight, notifyTypingWithDebounce],
    )

    // ===== 处理 IME 输入法组合事件 =====
    const handleCompositionStart = useCallback(() => {
        isComposingRef.current = true
    }, [])

    const handleCompositionEnd = useCallback(
        (e: React.CompositionEvent<HTMLTextAreaElement>) => {
            isComposingRef.current = false
            const newValue = (e.target as HTMLTextAreaElement).value

            syncDiffToPeer(newValue)
            lastSyncedValueRef.current = newValue

            setInputValue(newValue)
            adjustHeight()
        },
        [syncDiffToPeer, adjustHeight],
    )

    // ===== 清理计时器 =====
    useEffect(() => {
        return () => {
            if (typingTimerRef.current) {
                clearTimeout(typingTimerRef.current)
            }
        }
    }, [])

    /** 执行发送 */
    const doSend = useCallback(() => {
        if (!isConnected || inputValue.trim().length === 0) return
        if (lastSyncedValueRef.current !== inputValue) {
            syncDiffToPeer(inputValue)
            lastSyncedValueRef.current = inputValue
        }
        onFinishMessage()
        setInputValue('')
        lastSyncedValueRef.current = ''
        onTypingStop()
        if (typingTimerRef.current) {
            clearTimeout(typingTimerRef.current)
        }
        adjustHeight()
    }, [isConnected, inputValue, onFinishMessage, onTypingStop, syncDiffToPeer, adjustHeight])

    /** 获取占位符文本 */
    const getPlaceholder = () => {
        if (isConnected) return '给 Bro 发消息...'
        if (isWaiting) return '等待你的 Bro 连接中...'
        return '请先连接或等待对方连接...'
    }

    const canSend = isConnected && inputValue.trim().length > 0

    return (
        <div className="border-t border-line bg-[var(--bg)]">
            <div className="max-w-3xl mx-auto px-4 py-3">
                {/* ===== 输入框容器 ===== */}
                <div
                    className="
                        relative flex items-end
                        bg-surface border border-line
                        rounded-2xl
                        focus-within:border-[var(--text-tertiary)]
                        transition-colors duration-150
                    "
                >
                    {/* 文本输入区域 */}
                    <textarea
                        ref={textareaRef}
                        value={inputValue}
                        onChange={handleChange}
                        onKeyDown={handleKeyDown}
                        onPaste={handlePaste}
                        onCompositionStart={handleCompositionStart}
                        onCompositionEnd={handleCompositionEnd}
                        placeholder={getPlaceholder()}
                        disabled={!isConnected && !isWaiting}
                        rows={1}
                        className="
                            flex-1 bg-transparent text-text-primary
                            placeholder:text-text-tertiary
                            rounded-2xl px-4 py-3
                            resize-none outline-none
                            text-sm leading-relaxed
                            disabled:opacity-40 disabled:cursor-not-allowed
                            font-sans min-h-[44px] max-h-[160px]
                        "
                    />

                    {/* 发送按钮 */}
                    <button
                        onClick={doSend}
                        disabled={!canSend}
                        className="
                            shrink-0 m-2
                            w-8 h-8 rounded-xl
                            bg-accent hover:bg-accent-hover
                            text-white flex items-center justify-center
                            transition-all duration-150
                            disabled:opacity-20 disabled:cursor-not-allowed disabled:bg-accent
                            shadow-sm
                        "
                        title="发送消息 (Enter)"
                    >
                        <Send size={14} />
                    </button>
                </div>

                {/* ===== 底部提示信息 ===== */}
                <div className="flex items-center justify-center mt-2 px-1">
                    <p className="text-[11px] text-text-tertiary font-mono">
                        {isConnected
                            ? '实时流式传输中 · 每个按键都会即时发送给 Bro'
                            : isWaiting
                                ? '分享你的 API Key 给 Bro...'
                                : '进入设置配置 API Key 开始聊天'}
                    </p>
                </div>
            </div>
        </div>
    )
}

export default InputArea
