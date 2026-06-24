/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                /* 亮色模式 (ChatGPT 风格) */
                'bg': 'var(--bg)',
                'bg-secondary': 'var(--bg-secondary)',
                'surface': 'var(--surface)',
                'surface-hover': 'var(--surface-hover)',
                'border-color': 'var(--border-color)',
                'text-primary': 'var(--text-primary)',
                'text-secondary': 'var(--text-secondary)',
                'text-tertiary': 'var(--text-tertiary)',
                'accent': 'var(--accent)',
                'accent-hover': 'var(--accent-hover)',
                'success': '#10a37f',
                'warning': '#f59e0b',
                'danger': '#ef4444',
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
                mono: ['"JetBrains Mono"', '"Fira Code"', 'Menlo', 'monospace'],
            },
            animation: {
                'fade-in': 'fadeIn 0.2s ease-out',
                'slide-up': 'slideUp 0.25s ease-out',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { opacity: '0', transform: 'translateY(6px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
            },
        },
    },
    plugins: [],
}
