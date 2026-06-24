import React from 'react'
import {
    Link,
    Unlink,
    Sun,
    Moon,
    PanelLeftClose,
    PanelLeftOpen,
    Settings,
    MessageSquare,
    Plus,
} from 'lucide-react'
import { ConnectionStatus, type ChatMessage } from '@/types'
import { useTheme } from '@/contexts/ThemeContext'

/**
 * Sidebar 组件 - 左侧导航栏
 * ChatGPT 风格：可展开/收起，默认收起
 * 展开时显示对话列表，标题为当前会话的第一句话
 */
interface SidebarProps {
    collapsed: boolean
    onToggleCollapse: () => void
    connectionStatus: ConnectionStatus
    messages: ChatMessage[]
    onResetContext: () => void
    onOpenSettings: () => void
}

const Sidebar: React.FC<SidebarProps> = ({
    collapsed,
    onToggleCollapse,
    connectionStatus,
    messages,
    onResetContext,
    onOpenSettings,
}) => {
    const { theme, toggleTheme } = useTheme()
    const isConnected = connectionStatus === ConnectionStatus.Connected
    const isWaiting = connectionStatus === ConnectionStatus.Waiting
    const isConnecting = connectionStatus === ConnectionStatus.Connecting

    /** 获取第一条用户消息作为对话标题 */
    const getConversationTitle = () => {
        const firstUserMsg = messages.find((m) => m.role === 'user')
        if (firstUserMsg) {
            const text = firstUserMsg.content.trim()
            return text.length > 24 ? text.slice(0, 24) + '...' : text
        }
        return '新对话'
    }

    /** 获取连接状态文本 */
    const getStatusLabel = () => {
        if (isConnected) return '已连接'
        if (isWaiting) return '等待中'
        if (isConnecting) return '连接中'
        return '未连接'
    }

    /** 获取状态指示灯颜色类 */
    const getDotClass = () => {
        if (isConnected) return 'bg-green-500'
        if (isWaiting || isConnecting) return 'bg-amber-500 animate-pulse'
        return 'bg-gray-400 dark:bg-gray-600'
    }

    // ===== 收起模式：仅显示图标 =====
    if (collapsed) {
        return (
            <aside
                className="
                    w-[60px] h-full
                    bg-[var(--bg-secondary)]
                    border-r border-line
                    flex flex-col items-center shrink-0
                    select-none
                    transition-all duration-200
                "
            >
                {/* 展开按钮 */}
                <div className="pt-3 pb-2 w-full flex justify-center">
                    <button
                        onClick={onToggleCollapse}
                        className="
                            w-9 h-9 rounded-xl
                            hover:bg-surface-hover
                            text-text-secondary hover:text-text-primary
                            flex items-center justify-center
                            transition-colors duration-150
                        "
                        title="展开侧边栏"
                    >
                        <PanelLeftOpen size={18} />
                    </button>
                </div>

                {/* 对话图标按钮 */}
                <div className="flex-1 flex flex-col items-center gap-1 mt-2 w-full px-2">
                    {messages.length > 0 && (
                        <div
                            className="
                                w-9 h-9 rounded-xl
                                bg-surface border border-line
                                flex items-center justify-center
                            "
                            title={getConversationTitle()}
                        >
                            <MessageSquare size={15} className="text-text-secondary" />
                        </div>
                    )}
                </div>

                {/* 底部图标 */}
                <div className="pb-3 flex flex-col items-center gap-1 w-full px-2">
                    {/* 主题切换 */}
                    <button
                        onClick={toggleTheme}
                        className="
                            w-9 h-9 rounded-xl
                            hover:bg-surface-hover
                            text-text-secondary hover:text-text-primary
                            flex items-center justify-center
                            transition-colors duration-150
                        "
                        title={theme === 'dark' ? '切换到亮色模式' : '切换到暗色模式'}
                    >
                        {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                    </button>
                    {/* 设置 */}
                    <button
                        onClick={onOpenSettings}
                        className="
                            w-9 h-9 rounded-xl
                            hover:bg-surface-hover
                            text-text-secondary hover:text-text-primary
                            flex items-center justify-center
                            transition-colors duration-150
                        "
                        title="API 设置"
                    >
                        <Settings size={16} />
                    </button>
                </div>
            </aside>
        )
    }

    // ===== 展开模式：完整侧边栏 =====
    return (
        <aside
            className="
                w-[260px] h-full
                bg-[var(--bg-secondary)]
                border-r border-line
                flex flex-col shrink-0
                select-none
                transition-all duration-200
            "
        >
            {/* ===== 顶部：折叠按钮 + 新建对话 ===== */}
            <div className="px-3 pt-3 pb-2 flex items-center justify-between">
                <button
                    onClick={onToggleCollapse}
                    className="
                        w-9 h-9 rounded-xl
                        hover:bg-surface-hover
                        text-text-secondary hover:text-text-primary
                        flex items-center justify-center
                        transition-colors duration-150
                    "
                    title="收起侧边栏"
                >
                    <PanelLeftClose size={18} />
                </button>
                <button
                    onClick={onResetContext}
                    disabled={!isConnected}
                    className="
                        w-9 h-9 rounded-xl
                        hover:bg-surface-hover
                        text-text-secondary hover:text-text-primary
                        flex items-center justify-center
                        transition-colors duration-150
                        disabled:opacity-30 disabled:cursor-not-allowed
                    "
                    title="新建对话"
                >
                    <Plus size={18} />
                </button>
            </div>

            {/* ===== 对话列表 ===== */}
            <div className="flex-1 overflow-y-auto px-2 py-1 space-y-0.5">
                {/* 当前会话 */}
                {messages.length > 0 ? (
                    <div
                        className="
                            flex items-center gap-2.5
                            px-3 py-2.5 rounded-xl
                            bg-surface border border-line
                            cursor-default
                            transition-colors duration-150
                        "
                    >
                        <MessageSquare size={15} className="text-text-secondary shrink-0" />
                        <span className="text-sm text-text-primary truncate flex-1">
                            {getConversationTitle()}
                        </span>
                    </div>
                ) : (
                    <div
                        className="
                            flex items-center gap-2.5
                            px-3 py-2.5 rounded-xl
                            text-text-tertiary
                        "
                    >
                        <MessageSquare size={15} className="shrink-0" />
                        <span className="text-sm">暂无对话</span>
                    </div>
                )}
            </div>

            {/* ===== 连接状态 ===== */}
            <div className="px-3 py-2">
                <div
                    className="
                        flex items-center gap-2.5 px-3 py-2 rounded-xl
                        bg-surface border border-line
                        transition-colors duration-200
                    "
                >
                    <div className="relative">
                        {isConnected ? (
                            <Link size={13} className="text-green-500" />
                        ) : (
                            <Unlink size={13} className="text-text-tertiary" />
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${getDotClass()}`} />
                            <span className="text-[11px] text-text-primary font-medium truncate">
                                {getStatusLabel()}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ===== 底部操作 ===== */}
            <div className="px-3 py-2 border-t border-line space-y-1">
                <button
                    onClick={toggleTheme}
                    className="
                        w-full text-left px-3 py-2 rounded-xl text-sm
                        text-text-secondary hover:text-text-primary
                        hover:bg-surface-hover
                        transition-colors duration-150
                        flex items-center gap-2.5
                    "
                >
                    {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
                    <span>{theme === 'dark' ? '亮色模式' : '暗色模式'}</span>
                </button>
                <button
                    onClick={onOpenSettings}
                    className="
                        w-full text-left px-3 py-2 rounded-xl text-sm
                        text-text-secondary hover:text-text-primary
                        hover:bg-surface-hover
                        transition-colors duration-150
                        flex items-center gap-2.5
                    "
                >
                    <Settings size={15} />
                    <span>API 设置</span>
                </button>
                <p className="px-3 pt-1 text-[10px] text-text-tertiary font-mono">
                    v0.1.0 · Pure P2P
                </p>
            </div>
        </aside>
    )
}

export default Sidebar
