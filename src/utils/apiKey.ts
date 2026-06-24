/**
 * API Key 编解码工具
 * 将 PeerJS ID 伪装成类似 OpenAI/DeepSeek 的 API Key 格式
 * 格式: sk-broseek-{base64(peerId)}
 */

const API_KEY_PREFIX = 'sk-broseek-'

/**
 * 将 Peer ID 编码为伪 API Key
 * @param peerId - 原始 PeerJS ID
 * @returns 伪装后的 API Key，如 sk-broseek-YnJvMTIzNA==
 */
export function encodeApiKey(peerId: string): string {
    const encoded = btoa(unescape(encodeURIComponent(peerId)))
    return `${API_KEY_PREFIX}${encoded}`
}

/**
 * 从伪 API Key 解码出真实的 Peer ID
 * @param apiKey - 伪装后的 API Key
 * @returns 原始 Peer ID，解码失败返回 null
 */
export function decodeApiKey(apiKey: string): string | null {
    try {
        // 移除可能的空白字符
        const trimmed = apiKey.trim()
        if (!trimmed.startsWith(API_KEY_PREFIX)) {
            return null
        }
        const encoded = trimmed.slice(API_KEY_PREFIX.length)
        // 支持用户直接粘贴原始 Peer ID（不含前缀）
        if (!encoded || encoded.length === 0) {
            return null
        }
        // 尝试 Base64 解码
        const decoded = decodeURIComponent(escape(atob(encoded)))
        return decoded
    } catch {
        // 解码失败：可能用户直接粘贴了原始 Peer ID，尝试原样返回去掉前缀的部分
        const trimmed = apiKey.trim()
        if (trimmed.startsWith(API_KEY_PREFIX)) {
            return trimmed.slice(API_KEY_PREFIX.length)
        }
        return null
    }
}

/**
 * 验证 API Key 格式是否有效
 */
export function isValidApiKey(apiKey: string): boolean {
    return decodeApiKey(apiKey) !== null
}

/**
 * 生成随机 Peer ID（4位易读字母数字组合）
 * 保留 PeerJS 自动生成逻辑，但这里提供一个 fallback
 */
export function generatePeerId(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return `broseek-${result}`
}
