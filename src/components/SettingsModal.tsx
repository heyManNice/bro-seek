import React, { useState, useCallback, useEffect } from 'react'
import {
    X,
    Radio,
    Link,
    Unlink,
    Copy,
    Check,
    AlertCircle,
    Server,
    Plug,
    Cpu,
    Loader2,
} from 'lucide-react'
import { ConnectionStatus } from '@/types'

/**
 * SettingsModal 组件 - API 设置弹窗
 * ChatGPT 风格：干净、现代、分区块布局
 */
interface SettingsModalProps {
    open: boolean
    onClose: () => void
    connectionStatus: ConnectionStatus
    pseudoApiKey: string | null
    localModelName: string
    remoteModelName: string
    onStartHost: () => void
    onConnectToHost: (apiKey: string) => void
    onDisconnect: () => void
    onUpdateModelName: (name: string) => void
}

/** 预设模型列表（纯娱乐性质） */
const PRESET_MODELS = [
    'BroSeek-R1 (深度思考中)',
    'BroSeek-Lite (已喝高版)',
    'BroSeek-Pro (熬夜冠军)',
    'BroSeek-Turbo (光速响应)',
    'BroSeek-Vision (火眼金睛)',
    'BroSeek-4o (全能选手)',
]

const SettingsModal: React.FC<SettingsModalProps> = ({
    open,
    onClose,
    connectionStatus,
    pseudoApiKey,
    localModelName,
    remoteModelName,
    onStartHost,
    onConnectToHost,
    onDisconnect,
    onUpdateModelName,
}) => {
    const [apiKeyInput, setApiKeyInput] = useState('')
    const [customModelName, setCustomModelName] = useState(localModelName)
    const [connectError, setConnectError] = useState<string | null>(null)
    const [connectSuccess, setConnectSuccess] = useState(false)
    const [copied, setCopied] = useState(false)
    const [hostLoading, setHostLoading] = useState(false)

    /** 监听连接状态，真正连接成功后才显示成功提示 */
    useEffect(() => {
        if (connectionStatus === ConnectionStatus.Connected) {
            setConnectSuccess(true)
        } else {
            setConnectSuccess(false)
        }
    }, [connectionStatus])

    const isConnected = connectionStatus === ConnectionStatus.Connected
    const isWaiting = connectionStatus === ConnectionStatus.Waiting
    const isConnecting = connectionStatus === ConnectionStatus.Connecting

    /** 处理连接 */
    const handleConnect = useCallback(() => {
        setConnectError(null)
        setConnectSuccess(false)

        if (!apiKeyInput.trim()) {
            setConnectError('请输入 API Key')
            return
        }

        try {
            onConnectToHost(apiKeyInput.trim())
        } catch (err) {
            setConnectError(err instanceof Error ? err.message : '连接失败')
        }
    }, [apiKeyInput, onConnectToHost])

    /** 处理模型名称更新 */
    const handleModelChange = useCallback((name: string) => {
        setCustomModelName(name)
        onUpdateModelName(name)
    }, [onUpdateModelName])

    /** 复制 API Key 到剪贴板 */
    const copyApiKey = useCallback(async () => {
        if (!pseudoApiKey) return
        try {
            await navigator.clipboard.writeText(pseudoApiKey)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch {
            const textarea = document.createElement('textarea')
            textarea.value = pseudoApiKey
            document.body.appendChild(textarea)
            textarea.select()
            document.execCommand('copy')
            document.body.removeChild(textarea)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }, [pseudoApiKey])

    /** 获取状态标签 */
    const getStatusText = useCallback(() => {
        if (isConnected) return `已连接至: ${remoteModelName}`
        if (isWaiting) return '等待连接中...'
        if (isConnecting) return '正在连接...'
        return '未连接'
    }, [isConnected, isWaiting, isConnecting, remoteModelName])

    /** 处理启动 Host（带 loading 反馈） */
    const handleStartHost = useCallback(() => {
        if (isConnected || isWaiting) return
        setHostLoading(true)
        onStartHost()
    }, [isConnected, isWaiting, onStartHost])

    // 当 pseudoApiKey 出现或状态变化时，结束 loading
    React.useEffect(() => {
        if (pseudoApiKey || isWaiting) {
            setHostLoading(false)
        }
    }, [pseudoApiKey, isWaiting])

    // early return 放在所有 hooks 之后
    if (!open) return null

    return (
        <>
            {/* 遮罩层 */}
            <div
                className="fixed inset-0 bg-black/50 z-40 animate-fade-in"
                onClick={onClose}
            />

            {/* 弹窗 */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
                <div
                    className="
                        bg-[var(--bg)] border border-line rounded-2xl
                        w-full max-w-lg max-h-[90vh] overflow-y-auto
                        shadow-2xl
                        transition-colors duration-200
                    "
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* ===== 标题栏 ===== */}
                    <div className="flex items-center justify-between px-6 py-4">
                        <div className="flex items-center gap-2.5">
                            <Server size={18} className="text-accent" />
                            <h2 className="text-base font-semibold text-text-primary">
                                API 设置
                            </h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="
                                w-8 h-8 rounded-xl
                                hover:bg-surface-hover
                                text-text-secondary hover:text-text-primary
                                flex items-center justify-center
                                transition-colors duration-150
                            "
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* ===== 内容区 ===== */}
                    <div className="px-6 py-5 space-y-5">
                        {/* ===== 连接状态 ===== */}
                        <div className="flex items-center gap-2.5 p-3 bg-surface border border-line rounded-xl">
                            <span
                                className={`w-2 h-2 rounded-full ${isConnected
                                    ? 'bg-green-500'
                                    : isWaiting || isConnecting
                                        ? 'bg-amber-500 animate-pulse'
                                        : 'bg-gray-400 dark:bg-gray-600'
                                    }`}
                            />
                            <span className="text-sm text-text-secondary font-mono">
                                {getStatusText()}
                            </span>
                        </div>

                        {/* ===== Host 模式 ===== */}
                        <div>
                            <div className="flex items-center gap-2 mb-1.5">
                                <Radio size={15} className="text-accent" />
                                <h3 className="text-sm font-semibold text-text-primary">
                                    作为 Host（等待 Bro 连接）
                                </h3>
                            </div>
                            <p className="text-xs text-text-secondary mb-3 pl-[22px]">
                                生成一个 API Key，把它分享给你的 Bro，对方输入后即可建立 P2P 连接。
                            </p>
                            <div className="pl-[22px]">
                                <button
                                    onClick={isConnected ? () => {
                                        onDisconnect()
                                        setApiKeyInput('')
                                        setConnectError(null)
                                        setConnectSuccess(false)
                                    } : handleStartHost}
                                    disabled={(!isConnected && (isWaiting || hostLoading))}
                                    className={`
                                        w-full py-2.5 px-4 rounded-xl text-sm font-medium
                                        transition-all duration-200
                                        flex items-center justify-center gap-2
                                        ${isConnected
                                            ? 'bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20'
                                            : 'bg-surface hover:bg-surface-hover text-text-primary border border-line disabled:opacity-40 disabled:cursor-not-allowed'
                                        }
                                    `}
                                >
                                    {isConnected ? (
                                        <>
                                            <Unlink size={14} />
                                            断开连接
                                        </>
                                    ) : hostLoading ? (
                                        <>
                                            <Loader2 size={15} className="animate-spin" />
                                            正在生成 API Key...
                                        </>
                                    ) : isWaiting ? (
                                        '已启动，等待中...'
                                    ) : (
                                        '生成 API Key 并等待连接'
                                    )}
                                </button>

                                {/* 显示生成的 API Key */}
                                {pseudoApiKey && (
                                    <div className="mt-3 p-3 bg-surface rounded-xl border border-line">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs text-text-secondary font-mono">
                                                你的 API Key
                                            </span>
                                            <button
                                                onClick={copyApiKey}
                                                className="
                                                    flex items-center gap-1 text-xs text-accent
                                                    hover:text-accent-hover transition-colors font-mono
                                                "
                                                title="复制到剪贴板"
                                            >
                                                {copied ? <Check size={12} /> : <Copy size={12} />}
                                                {copied ? '已复制' : '复制'}
                                            </button>
                                        </div>
                                        <code className="text-xs text-green-600 dark:text-green-400 break-all font-mono select-all block">
                                            {pseudoApiKey}
                                        </code>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* ===== Client 模式 ===== */}
                        <div>
                            <div className="flex items-center gap-2 mb-1.5">
                                <Plug size={15} className="text-accent" />
                                <h3 className="text-sm font-semibold text-text-primary">
                                    作为 Client（连接 Bro）
                                </h3>
                            </div>
                            <p className="text-xs text-text-secondary mb-3 pl-[22px]">
                                输入 Bro 分享给你的 API Key，建立 P2P 连接。
                            </p>

                            <div className="space-y-2 pl-[22px]">
                                {/* API Key 输入框 */}
                                <div>
                                    <label className="block text-xs text-text-secondary mb-1 font-mono">
                                        API Key
                                    </label>
                                    <input
                                        type="text"
                                        value={apiKeyInput}
                                        onChange={(e) => {
                                            setApiKeyInput(e.target.value)
                                            setConnectError(null)
                                            setConnectSuccess(false)
                                        }}
                                        placeholder="sk-broseek-..."
                                        disabled={isConnected}
                                        className="
                                            w-full bg-bg text-text-primary font-mono text-sm
                                            placeholder:text-text-tertiary
                                            rounded-xl px-3 py-2.5 outline-none
                                            border border-line
                                            focus:border-accent
                                            transition-colors duration-150
                                            disabled:opacity-50
                                        "
                                    />
                                </div>

                                {/* 错误/成功提示 */}
                                {connectError && (
                                    <p className="text-xs text-red-500 flex items-center gap-1.5">
                                        <AlertCircle size={12} />
                                        {connectError}
                                    </p>
                                )}
                                {connectSuccess && (
                                    <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1.5">
                                        <Check size={12} />
                                        Base model connected successfully.
                                    </p>
                                )}

                                <button
                                    onClick={isConnected ? () => {
                                        onDisconnect()
                                        setApiKeyInput('')
                                        setConnectError(null)
                                        setConnectSuccess(false)
                                    } : handleConnect}
                                    disabled={(!isConnected && (isConnecting || !apiKeyInput.trim()))}
                                    className={`
                                        w-full py-2.5 px-4 rounded-xl text-sm font-medium
                                        transition-all duration-150
                                        flex items-center justify-center gap-2
                                        ${isConnected
                                            ? 'bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20'
                                            : 'bg-surface hover:bg-surface-hover text-text-primary border border-line disabled:opacity-40 disabled:cursor-not-allowed'
                                        }
                                    `}
                                >
                                    {isConnected ? (
                                        <>
                                            <Unlink size={14} />
                                            断开连接
                                        </>
                                    ) : isConnecting ? (
                                        '连接中...'
                                    ) : (
                                        '连接'
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* ===== 模型选择 ===== */}
                        <div>
                            <div className="flex items-center gap-2 mb-1.5">
                                <Cpu size={15} className="text-accent" />
                                <h3 className="text-sm font-semibold text-text-primary">
                                    模型选择 (Model)
                                </h3>
                            </div>
                            <p className="text-xs text-text-secondary mb-3 pl-[22px]">
                                选择一个模型名称，对方会看到这个名称（纯娱乐，不影响通信）。
                            </p>

                            <div className="pl-[22px]">
                                {/* 预设模型列表 */}
                                <div className="grid grid-cols-2 gap-2 mb-3">
                                    {PRESET_MODELS.map((model) => (
                                        <button
                                            key={model}
                                            onClick={() => handleModelChange(model)}
                                            className={`
                                                text-left px-3 py-2 rounded-xl text-xs
                                                transition-colors duration-150 border
                                                ${customModelName === model
                                                    ? 'bg-accent/10 border-accent/40 text-text-primary'
                                                    : 'bg-surface border-line text-text-secondary hover:text-text-primary hover:border-line'
                                                }
                                            `}
                                        >
                                            {model}
                                        </button>
                                    ))}
                                </div>

                                {/* 自定义模型名称 */}
                                <div>
                                    <label className="block text-xs text-text-secondary mb-1 font-mono">
                                        自定义模型名称
                                    </label>
                                    <input
                                        type="text"
                                        value={customModelName}
                                        onChange={(e) => handleModelChange(e.target.value)}
                                        placeholder="输入自定义模型名称..."
                                        className="
                                            w-full bg-bg text-text-primary text-sm
                                            placeholder:text-text-tertiary
                                            rounded-xl px-3 py-2.5 outline-none
                                            border border-line
                                            focus:border-accent
                                            transition-colors duration-150
                                        "
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ===== 底部 ===== */}
                    <div className="px-6 py-3 flex justify-end">
                        <button
                            onClick={onClose}
                            className="
                                py-2 px-5 rounded-xl text-sm font-medium
                                bg-surface hover:bg-surface-hover
                                text-text-primary border border-line
                                transition-colors duration-150
                            "
                        >
                            完成
                        </button>
                    </div>
                </div>
            </div>
        </>
    )
}

export default SettingsModal
