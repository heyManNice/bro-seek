import React, { useState, useCallback } from 'react'
import { Menu } from 'lucide-react'
import { usePeerConnection } from '@/hooks/usePeerConnection'
import { ConnectionStatus } from '@/types'
import { ThemeProvider } from '@/contexts/ThemeContext'
import Sidebar from '@/components/Sidebar'
import ChatView from '@/components/ChatView'
import InputArea from '@/components/InputArea'
import SettingsModal from '@/components/SettingsModal'

/**
 * App - BroSeek 应用主组件
 * 组合所有子组件，管理全局布局
 */
const App: React.FC = () => {
    const [settingsOpen, setSettingsOpen] = useState(false)
    const [sidebarCollapsed, setSidebarCollapsed] = useState(true)

    const {
        connectionStatus,
        pseudoApiKey,
        localModelName,
        remoteModelName,
        isRemoteTyping,
        messages,
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
    } = usePeerConnection()

    /** 打开设置 */
    const handleOpenSettings = useCallback(() => {
        setSettingsOpen(true)
    }, [])

    /** 关闭设置 */
    const handleCloseSettings = useCallback(() => {
        setSettingsOpen(false)
    }, [])

    /** 切换侧边栏展开/收起 */
    const toggleSidebar = useCallback(() => {
        setSidebarCollapsed((prev) => !prev)
    }, [])

    return (
        <ThemeProvider>
            <div className="h-full w-full flex bg-[var(--bg)] transition-colors duration-200 relative">
                {/* 移动端菜单按钮 */}
                <button
                    onClick={toggleSidebar}
                    className="
                        md:hidden fixed top-2 left-3 z-30
                        w-9 h-9 rounded-xl
                        text-text-secondary hover:text-text-primary
                        flex items-center justify-center
                        transition-colors duration-150
                    "
                    title="打开菜单"
                >
                    <Menu size={18} />
                </button>

                {/* 移动端遮罩层 */}
                {sidebarCollapsed === false && (
                    <div
                        className="
                            md:hidden fixed inset-0 z-30
                            bg-black/40
                            transition-opacity duration-200
                        "
                        onClick={toggleSidebar}
                    />
                )}

                {/* 左侧边栏 */}
                <div className={`
                    max-md:fixed max-md:inset-y-0 max-md:left-0 max-md:z-40
                    max-md:transition-transform max-md:duration-200
                    ${sidebarCollapsed ? 'max-md:-translate-x-full' : 'max-md:translate-x-0'}
                `}>
                    <Sidebar
                        collapsed={sidebarCollapsed}
                        onToggleCollapse={toggleSidebar}
                        connectionStatus={connectionStatus}
                        messages={messages}
                        onResetContext={resetContext}
                        onOpenSettings={handleOpenSettings}
                    />
                </div>

                {/* 右侧主区域 */}
                <div className="flex-1 flex flex-col min-w-0 h-full relative">
                    {/* ===== 聊天消息列表（有消息时才显示） ===== */}
                    {messages.length > 0 && (
                        <ChatView
                            messages={messages}
                            remoteModelName={remoteModelName}
                            isRemoteTyping={isRemoteTyping}
                            connectionStatus={connectionStatus}
                            onReaction={sendReaction}
                        />
                    )}

                    {/* ===== 输入框（始终单实例，绝对定位切换位置） ===== */}
                    <InputArea
                        connectionStatus={connectionStatus}
                        onSendChar={sendChar}
                        onSendDeleteChar={sendDeleteChar}
                        onFinishMessage={finishMessage}
                        onTyping={notifyTyping}
                        onTypingStop={notifyTypingStop}
                        isCentered={messages.length === 0}
                    />
                </div>

                {/* 设置弹窗 */}
                <SettingsModal
                    open={settingsOpen}
                    onClose={handleCloseSettings}
                    connectionStatus={connectionStatus}
                    pseudoApiKey={pseudoApiKey}
                    localModelName={localModelName}
                    remoteModelName={remoteModelName}
                    onStartHost={startHost}
                    onConnectToHost={(apiKey) => connectToHost(apiKey)}
                    onDisconnect={disconnect}
                    onUpdateModelName={updateModelName}
                />
            </div>
        </ThemeProvider>
    )
}

export default App
