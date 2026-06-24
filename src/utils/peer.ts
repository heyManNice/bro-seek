import Peer, { DataConnection } from 'peerjs'
import { DataAction, type DataPayload } from '@/types'

/**
 * 通过 DataChannel 发送流式字符
 */
export function sendStreamChar(conn: DataConnection, char: string): void {
    const payload: DataPayload = {
        action: DataAction.StreamChar,
        char,
    }
    conn.send(payload)
}

/**
 * 通知对端流式发送结束（当前消息完成）
 */
export function sendStreamEnd(conn: DataConnection, content: string): void {
    const payload: DataPayload = {
        action: DataAction.StreamEnd,
        content,
    }
    conn.send(payload)
}

/**
 * 通知对端删除了字符（退格）
 * @param count - 删除的字符数，默认 1
 */
export function sendBackspace(conn: DataConnection, count: number = 1): void {
    const payload: DataPayload = {
        action: DataAction.Backspace,
        deleteCount: count,
    }
    conn.send(payload)
}

/**
 * 通知对端自己正在打字
 */
export function sendTyping(conn: DataConnection): void {
    const payload: DataPayload = {
        action: DataAction.Typing,
    }
    conn.send(payload)
}

/**
 * 通知对端自己停止打字
 */
export function sendTypingStop(conn: DataConnection): void {
    const payload: DataPayload = {
        action: DataAction.TypingStop,
    }
    conn.send(payload)
}

/**
 * 发送清除上下文指令
 */
export function sendResetContext(conn: DataConnection): void {
    const payload: DataPayload = {
        action: DataAction.ResetContext,
    }
    conn.send(payload)
}

/**
 * 发送本地模型名称给对方
 */
export function sendModelName(conn: DataConnection, modelName: string): void {
    const payload: DataPayload = {
        action: DataAction.ModelName,
        modelName,
    }
    conn.send(payload)
}
/**
 * 发送反应（点赞/踩）给对方
 * @param targetMsgId - 目标消息 ID
 * @param reactionType - 反应类型
 */
export function sendReaction(
    conn: DataConnection,
    targetMsgId: string,
    reactionType: 'up' | 'down',
): void {
    const payload: DataPayload = {
        action: DataAction.Reaction,
        targetMsgId,
        reactionType,
    }
    conn.send(payload)
}
/**
 * 创建 Peer 实例
 * @param id - 可选的自定义 ID，不传则由 PeerJS 自动生成
 */
export function createPeer(id?: string): Peer {
    // 使用 PeerJS 公共信令服务器
    const options = {
        config: {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' },
            ],
        },
    }
    // PeerJS 构造函数: 无 id 时自动生成，有 id 时使用指定 id
    const peer = id ? new Peer(id, options) : new Peer(options)
    return peer
}
