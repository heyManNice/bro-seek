/**
 * pre-render 脚本
 * 用无头浏览器打开 dist/index.html，等待 JS 渲染完成后
 * 将完整的 HTML 写回 dist/index.html
 *
 * 用法: npx tsx tools/prerender.ts
 */
import { chromium, type Browser, type Page } from 'playwright'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const distDir: string = resolve(import.meta.dirname, '..', 'dist')
const indexHtml: string = resolve(distDir, 'index.html')

async function main(): Promise<void> {
    console.log('[prerender] 启动无头浏览器...')

    const browser: Browser = await chromium.launch({ headless: true })
    const page: Page = await browser.newPage()

    // 用 file:// 协议加载本地构建产物
    const fileUrl: string = `file:///${indexHtml.replace(/\\/g, '/')}`
    console.log(`[prerender] 加载 ${fileUrl}`)

    await page.goto(fileUrl, { waitUntil: 'networkidle' })

    // 额外等待确保 React 渲染完毕
    await page.waitForTimeout(1000)

    // 获取渲染后的完整 HTML
    const renderedHtml: string = await page.content()

    // 写回 dist/index.html
    writeFileSync(indexHtml, renderedHtml, 'utf-8')
    console.log(`[prerender] 已将渲染后的 HTML 写回 ${indexHtml}`)

    await browser.close()
    console.log('[prerender] 完成 ✓')
}

main().catch((err: unknown) => {
    console.error('[prerender] 失败:', err)
    process.exit(1)
})
