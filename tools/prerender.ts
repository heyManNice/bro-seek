/**
 * pre-render 脚本
 * 通过 Vite preview 启动本地服务器，再用 Playwright 无头浏览器访问
 * 等待 JS 渲染完成后，将完整的 HTML 写回 dist/index.html
 *
 * 用法: npx tsx tools/prerender.ts
 */
import { chromium, type Browser, type Page } from 'playwright'
import { preview, type PreviewServer } from 'vite'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const distDir: string = resolve(import.meta.dirname, '..', 'dist')
const indexHtml: string = resolve(distDir, 'index.html')

async function main(): Promise<void> {
    // 启动 Vite preview 服务器
    console.log('[prerender] 启动 Vite preview 服务器...')
    const server: PreviewServer = await preview({
        preview: {
            port: 4173,
            open: false,
        },
    })
    const baseUrl: string = server.resolvedUrls.local[0]
    console.log(`[prerender] 服务器就绪: ${baseUrl}`)

    // 启动无头浏览器
    console.log('[prerender] 启动无头浏览器...')
    const browser: Browser = await chromium.launch({ headless: true })
    const page: Page = await browser.newPage()

    await page.goto(baseUrl, { waitUntil: 'networkidle' })

    // 额外等待确保 React 渲染完毕
    await page.waitForTimeout(1000)

    // 获取渲染后的完整 HTML
    const renderedHtml: string = await page.content()

    // 写回 dist/index.html
    writeFileSync(indexHtml, renderedHtml, 'utf-8')
    console.log(`[prerender] 已将渲染后的 HTML 写回 ${indexHtml}`)

    await browser.close()
    await server.close()
    console.log('[prerender] 完成 ✓')
}

main().catch((err: unknown) => {
    console.error('[prerender] 失败:', err)
    process.exit(1)
})
