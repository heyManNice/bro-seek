import {
    useState,
    useCallback,
    useRef,
    useEffect,
} from 'react'
import Peer, { DataConnection } from 'peerjs'
import {
    ConnectionStatus,
    DataAction,
    MessageRole,
    type DataPayload,
    type ChatMessage,
} from '@/types'
import {
    createPeer,
    sendModelName,
    sendStreamChar,
    sendStreamEnd,
    sendBackspace,
    sendTyping,
    sendTypingStop,
    sendReaction as sendReactionToPeer,
} from '@/utils/peer'
import { encodeApiKey, decodeApiKey } from '@/utils/apiKey'

/** 打字停止检测延迟 (ms) */
const TYPING_STOP_DELAY = 1500

/**
 * usePeerConnection - BroSeek 核心 P2P 连接 Hook
 * 管理 PeerJS 生命周期、DataChannel 通信、流式消息传递
 */
export function usePeerConnection() {
    // ===== 状态 =====
    const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(
        ConnectionStatus.Idle,
    )
    const [localPeerId, setLocalPeerId] = useState<string | null>(null)
    const [pseudoApiKey, setPseudoApiKey] = useState<string | null>(null)
    const [remotePeerId, setRemotePeerId] = useState<string | null>(null)
    const [localModelName, setLocalModelName] = useState<string>(
        'BroSeek-R1 (深度思考中)',
    )
    const [remoteModelName, setRemoteModelName] = useState<string>(
        'BroSeek-R1',
    )
    const [isRemoteTyping, setIsRemoteTyping] = useState(false)
    const [messages, setMessages] = useState<ChatMessage[]>([])

    // ===== Refs =====
    const peerRef = useRef<Peer | null>(null)
    const connRef = useRef<DataConnection | null>(null)
    const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    /** 当前正在流式构建的消息 ID */
    const streamingMsgIdRef = useRef<string | null>(null)
    /** 本地流式消息 ID（防止自己打字触发重复创建） */
    const localStreamingMsgIdRef = useRef<string | null>(null)

    // ===== 清理函数 =====
    const cleanup = useCallback(() => {
        if (typingTimerRef.current) {
            clearTimeout(typingTimerRef.current)
            typingTimerRef.current = null
        }
        if (connRef.current) {
            connRef.current.close()
            connRef.current = null
        }
        if (peerRef.current) {
            peerRef.current.destroy()
            peerRef.current = null
        }
    }, [])

    // 组件卸载时清理
    useEffect(() => {
        return () => {
            cleanup()
        }
    }, [cleanup])

    // ===== 生成唯一消息 ID =====
    const genMsgId = useCallback(() => {
        return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
    }, [])

    // ===== 处理收到的 DataChannel 消息 =====
    const handleData = useCallback(
        (data: unknown) => {
            const payload = data as DataPayload
            if (!payload || !payload.action) return

            switch (payload.action) {
                case DataAction.StreamChar: {
                    // 收到流式字符 - 追加到当前 assistant 消息
                    if (payload.char) {
                        setIsRemoteTyping(false) // 收到实际字符，取消 typing 状态
                        // 重置 typing 检测计时器
                        if (typingTimerRef.current) {
                            clearTimeout(typingTimerRef.current)
                        }
                        typingTimerRef.current = setTimeout(() => {
                            setIsRemoteTyping(false)
                        }, TYPING_STOP_DELAY)

                        setMessages((prev) => {
                            // 查找当前正在流式输出的消息
                            const streamingMsg = prev.find(
                                (m) => m.id === streamingMsgIdRef.current && m.isStreaming,
                            )
                            if (streamingMsg) {
                                return prev.map((m) =>
                                    m.id === streamingMsg.id
                                        ? { ...m, content: m.content + payload.char! }
                                        : m,
                                )
                            }
                            // 创建新的流式消息（assistant 角色）
                            const newMsg: ChatMessage = {
                                id: genMsgId(),
                                role: MessageRole.Assistant,
                                content: payload.char!,
                                timestamp: Date.now(),
                                isStreaming: true,
                                reactions: { thumbsUp: 0, thumbsDown: 0 },
                            }
                            streamingMsgIdRef.current = newMsg.id
                            return [...prev, newMsg]
                        })
                    }
                    break
                }

                case DataAction.StreamEnd: {
                    // 流式发送结束 - 标记所有流式消息为完成
                    setMessages((prev) =>
                        prev.map((m) =>
                            m.isStreaming ? { ...m, isStreaming: false } : m,
                        ),
                    )
                    streamingMsgIdRef.current = null
                    setIsRemoteTyping(false)
                    break
                }

                case DataAction.Backspace: {
                    // 对端删除了字符 - 从当前流式消息末尾移除
                    const count = payload.deleteCount ?? 1
                    if (streamingMsgIdRef.current) {
                        setMessages((prev) =>
                            prev.map((m) => {
                                if (m.id === streamingMsgIdRef.current && m.isStreaming) {
                                    const newContent = m.content.slice(0, -count)
                                    // 如果内容被完全删空，移除这条消息
                                    if (newContent.length === 0) {
                                        streamingMsgIdRef.current = null
                                        return null as unknown as ChatMessage
                                    }
                                    return { ...m, content: newContent }
                                }
                                return m
                            }).filter(Boolean),
                        )
                    }
                    break
                }

                case DataAction.Typing: {
                    // 对端正在打字
                    setIsRemoteTyping(true)
                    if (typingTimerRef.current) {
                        clearTimeout(typingTimerRef.current)
                    }
                    typingTimerRef.current = setTimeout(() => {
                        setIsRemoteTyping(false)
                    }, TYPING_STOP_DELAY)
                    break
                }

                case DataAction.TypingStop: {
                    setIsRemoteTyping(false)
                    if (typingTimerRef.current) {
                        clearTimeout(typingTimerRef.current)
                    }
                    break
                }

                case DataAction.ResetContext: {
                    // 清空本地消息
                    setMessages([])
                    streamingMsgIdRef.current = null
                    localStreamingMsgIdRef.current = null
                    break
                }

                case DataAction.Reaction: {
                    // 对端对我发送的消息点了反应
                    if (payload.targetMsgId && payload.reactionType) {
                        setMessages((prev) =>
                            prev.map((m) => {
                                if (m.id !== payload.targetMsgId) return m
                                const reactions = { ...m.reactions }
                                if (payload.reactionType === 'up') {
                                    reactions.thumbsUp += 1
                                } else {
                                    reactions.thumbsDown += 1
                                }
                                return { ...m, reactions }
                            }),
                        )
                    }
                    break
                }

                case DataAction.ModelName: {
                    // 收到对端的模型名称
                    if (payload.modelName) {
                        setRemoteModelName(payload.modelName)
                    }
                    break
                }
            }
        },
        [genMsgId],
    )

    // ===== 设置 DataConnection 监听 =====
    const setupConnection = useCallback(
        (conn: DataConnection) => {
            connRef.current = conn

            conn.on('data', handleData)

            conn.on('open', () => {
                setConnectionStatus(ConnectionStatus.Connected)
                // 连接成功后发送自己的模型名称
                sendModelName(conn, localModelName)
            })

            conn.on('close', () => {
                setConnectionStatus(ConnectionStatus.Disconnected)
                connRef.current = null
            })

            conn.on('error', (err) => {
                console.error('DataConnection error:', err)
                setConnectionStatus(ConnectionStatus.Disconnected)
            })
        },
        [handleData, localModelName],
    )

    // ===== Host 模式：启动 Peer 并等待连接 =====
    const startHost = useCallback(() => {
        cleanup()

        const peer = createPeer()
        peerRef.current = peer

        peer.on('open', (id) => {
            setLocalPeerId(id)
            const apiKey = encodeApiKey(id)
            setPseudoApiKey(apiKey)
            setConnectionStatus(ConnectionStatus.Waiting)
        })

        // 监听来自远端的连接请求
        peer.on('connection', (conn) => {
            setRemotePeerId(conn.peer)
            setupConnection(conn)
        })

        peer.on('error', (err) => {
            console.error('Peer error:', err)
            // 如果是 ID 已被占用的错误，使用随机 ID 重试
            if (err.type === 'unavailable-id') {
                peer.destroy()
                const retryPeer = createPeer()
                peerRef.current = retryPeer
                retryPeer.on('open', (id) => {
                    setLocalPeerId(id)
                    setPseudoApiKey(encodeApiKey(id))
                    setConnectionStatus(ConnectionStatus.Waiting)
                })
                retryPeer.on('connection', (conn) => {
                    setRemotePeerId(conn.peer)
                    setupConnection(conn)
                })
                return
            }
            setConnectionStatus(ConnectionStatus.Disconnected)
        })

        peer.on('disconnected', () => {
            // PeerJS 可能尝试重连
            peer.reconnect()
        })
    }, [cleanup, setupConnection])

    // ===== Client 模式：使用 API Key 连接 Host =====
    const connectToHost = useCallback(
        (apiKey: string) => {
            cleanup()

            const targetPeerId = decodeApiKey(apiKey)
            if (!targetPeerId) {
                throw new Error('无效的 API Key！请检查格式是否为 sk-broseek-...')
            }

            setConnectionStatus(ConnectionStatus.Connecting)

            const peer = createPeer()
            peerRef.current = peer

            peer.on('open', (id) => {
                setLocalPeerId(id)

                // 发起连接
                const conn = peer.connect(targetPeerId, {
                    reliable: true,
                    serialization: 'json',
                })

                setRemotePeerId(targetPeerId)
                setupConnection(conn)
            })

            peer.on('error', (err) => {
                console.error('Peer error:', err)
                setConnectionStatus(ConnectionStatus.Disconnected)
            })

            peer.on('disconnected', () => {
                peer.reconnect()
            })
        },
        [cleanup, setupConnection],
    )

    // ===== 断开连接 =====
    const disconnect = useCallback(() => {
        cleanup()
        setConnectionStatus(ConnectionStatus.Idle)
        setLocalPeerId(null)
        setPseudoApiKey(null)
        setRemotePeerId(null)
        setMessages([])
        streamingMsgIdRef.current = null
        localStreamingMsgIdRef.current = null
        setIsRemoteTyping(false)
    }, [cleanup])

    // ===== 发送流式字符（本地用户打字时调用） =====
    const sendChar = useCallback(
        (char: string) => {
            if (!connRef.current) return

            // 确保本地有对应的 user 消息在构建中
            setMessages((prev) => {
                const streamingLocal = prev.find(
                    (m) => m.id === localStreamingMsgIdRef.current && m.isStreaming,
                )
                if (streamingLocal) {
                    return prev.map((m) =>
                        m.id === streamingLocal.id
                            ? { ...m, content: m.content + char }
                            : m,
                    )
                }
                // 创建新的本地用户消息
                const newMsg: ChatMessage = {
                    id: genMsgId(),
                    role: MessageRole.User,
                    content: char,
                    timestamp: Date.now(),
                    isStreaming: true,
                    reactions: { thumbsUp: 0, thumbsDown: 0 },
                }
                localStreamingMsgIdRef.current = newMsg.id
                return [...prev, newMsg]
            })

            // 通过 DataChannel 发送给对方
            sendStreamChar(connRef.current, char)
        },
        [genMsgId],
    )

    // ===== 结束本地消息（按回车或发送时调用） =====
    const finishMessage = useCallback(() => {
        if (!connRef.current) return

        // 结束所有本地流式消息
        setMessages((prev) =>
            prev.map((m) =>
                m.isStreaming ? { ...m, isStreaming: false } : m,
            ),
        )
        localStreamingMsgIdRef.current = null

        // 通知对端消息结束（同时也告诉对端完整的消息内容，以便回溯）
        sendStreamEnd(connRef.current, '')
        sendTypingStop(connRef.current)
    }, [])

    // ===== 通知对端打字状态 =====
    const notifyTyping = useCallback(() => {
        if (!connRef.current) return
        sendTyping(connRef.current)
    }, [])

    // ===== 通知对端停止打字 =====
    const notifyTypingStop = useCallback(() => {
        if (!connRef.current) return
        sendTypingStop(connRef.current)
    }, [])

    // ===== 通知对端删除了字符（本地用户按退格） =====
    const sendDeleteChar = useCallback(
        (count: number = 1) => {
            if (!connRef.current) return
            // 从本地流式消息末尾移除字符
            if (localStreamingMsgIdRef.current) {
                setMessages((prev) =>
                    prev.map((m) => {
                        if (m.id === localStreamingMsgIdRef.current && m.isStreaming) {
                            const newContent = m.content.slice(0, -count)
                            if (newContent.length === 0) {
                                localStreamingMsgIdRef.current = null
                                return null as unknown as ChatMessage
                            }
                            return { ...m, content: newContent }
                        }
                        return m
                    }).filter(Boolean),
                )
            }
            // 通知对端删除
            sendBackspace(connRef.current, count)
        },
        [],
    )

    // ===== 修改本地模型名称 =====
    const updateModelName = useCallback(
        (name: string) => {
            setLocalModelName(name)
            if (connRef.current) {
                sendModelName(connRef.current, name)
            }
        },
        [],
    )

    // ===== 发送反应（点赞/踩） =====
    const sendReaction = useCallback(
        (targetMsgId: string, reactionType: 'up' | 'down') => {
            // 本地增加计数
            setMessages((prev) =>
                prev.map((m) => {
                    if (m.id !== targetMsgId) return m
                    const reactions = { ...m.reactions }
                    if (reactionType === 'up') {
                        reactions.thumbsUp += 1
                    } else {
                        reactions.thumbsDown += 1
                    }
                    return { ...m, reactions }
                }),
            )
            // 通知对端
            if (connRef.current) {
                sendReactionToPeer(connRef.current, targetMsgId, reactionType)
            }
        },
        [],
    )

    // ===== 重置上下文（清空聊天记录） =====
    const resetContext = useCallback(() => {
        setMessages([])
        streamingMsgIdRef.current = null
        localStreamingMsgIdRef.current = null
        // 如果已连接，通知对端也清空
        if (connRef.current) {
            const payload: DataPayload = { action: DataAction.ResetContext }
            connRef.current.send(payload)
        }
    }, [])

    return {
        // 状态
        connectionStatus,
        localPeerId,
        pseudoApiKey,
        remotePeerId,
        localModelName,
        remoteModelName,
        isRemoteTyping,
        messages,

        // 操作
        startHost,
        connectToHost,
        disconnect,
        sendChar,
        sendDeleteChar,
        finishMessage,
        notifyTyping,
        notifyTypingStop,
        updateModelName,
        resetContext,
        sendReaction,
        setMessages,
    }
}
