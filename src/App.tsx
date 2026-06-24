import React, { useState, useCallback } from 'react'
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
            <div className="h-full w-full flex bg-[var(--bg)] transition-colors duration-200">
                {/* 左侧边栏 */}
                <Sidebar
                    collapsed={sidebarCollapsed}
                    onToggleCollapse={toggleSidebar}
                    connectionStatus={connectionStatus}
                    messages={messages}
                    onResetContext={resetContext}
                    onOpenSettings={handleOpenSettings}
                />

                {/* 右侧主区域 */}
                <div className="flex-1 flex flex-col min-w-0 h-full relative">
                    {/* 聊天视窗 */}
                    <ChatView
                        messages={messages}
                        remoteModelName={remoteModelName}
                        isRemoteTyping={isRemoteTyping}
                        connectionStatus={connectionStatus}
                        onReaction={sendReaction}
                    />

                    {/* 底部输入区 */}
                    <InputArea
                        connectionStatus={connectionStatus}
                        onSendChar={sendChar}
                        onSendDeleteChar={sendDeleteChar}
                        onFinishMessage={finishMessage}
                        onTyping={notifyTyping}
                        onTypingStop={notifyTypingStop}
                    />

                    {/* (设置按钮已移至侧边栏) */}
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
