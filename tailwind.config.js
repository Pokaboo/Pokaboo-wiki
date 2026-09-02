/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Enable dark mode via class
  theme: {
    extend: {
      fontFamily: {
        // Inter Variable 本地托管；中文回退系统栈
        sans: [
          '"Inter Variable"', 'Inter',
          '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"',
          '"PingFang SC"', '"HarmonyOS Sans SC"', '"Microsoft YaHei"',
          'system-ui', 'sans-serif'
        ],
        display: [
          '"Inter Variable"', 'Inter',
          '"PingFang SC"', '"HarmonyOS Sans SC"', '"Microsoft YaHei"',
          'system-ui', 'sans-serif'
        ],
        mono: [
          '"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular',
          'Menlo', 'Consolas', 'monospace'
        ],
      },
      colors: {
        // 品牌主色（Linear 式紫，克制点缀用）
        brand: {
          50: '#f0f1fd',
          100: '#e3e4fa',
          200: '#c9ccf5',
          300: '#a4a9ee',
          400: '#7f86e5',
          500: '#5e6ad2',
          600: '#4f59bd',
          700: '#424aa0',
          800: '#3a4184',
          900: '#353b6e',
          950: '#1f2345',
        },
        accent: {
          400: '#7f86e5',
          500: '#5e6ad2',
          600: '#4f59bd',
        },
        // 内容表面色：Notion 式中性灰（近白底 / 内容白 / 深灰）
        surface: {
          DEFAULT: '#ffffff',
          muted: '#f7f7f5',
          deep: '#191919',
        },
      },
      boxShadow: {
        card: '0 1px 2px rgba(16,24,40,0.04), 0 2px 8px -1px rgba(16,24,40,0.06)',
        cardHover: '0 4px 16px -2px rgba(79,86,246,0.12), 0 8px 28px -6px rgba(16,24,40,0.12)',
        glow: '0 0 0 1px rgba(99,102,241,0.10), 0 8px 40px -8px rgba(99,102,241,0.35)',
        pop: '0 20px 60px -15px rgba(2,6,23,0.35)',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translate3d(0,0,0) scale(1)' },
          '50%': { transform: 'translate3d(12px,-14px,0) scale(1.06)' },
        },
        'float-slow': {
          '0%, 100%': { transform: 'translate3d(0,0,0) scale(1)' },
          '50%': { transform: 'translate3d(-16px,10px,0) scale(1.08)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-400px 0' },
          '100%': { backgroundPosition: '400px 0' },
        },
      },
      animation: {
        float: 'float 8s ease-in-out infinite',
        'float-slow': 'float-slow 11s ease-in-out infinite',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
