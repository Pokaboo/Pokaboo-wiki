import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  build: {
    // 体积警告阈值放宽（第三方可视化/编辑器引擎本身较大，已按需按路由懒加载）
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        /**
         * 按第三方包拆分 vendor chunk：
         * 提升缓存命中率并压缩主包体积（ECharts / ByteMD+KaTeX 体积较大）
         */
        manualChunks(id: string) {
          if (!id.includes('node_modules')) return undefined;
          const m = id.match(/node_modules[\\/](.+?)(?:[\\/]|$)/);
          if (!m) return undefined;
          const pkgName = m[1].startsWith('@') ? m[1].split('/').slice(0, 2).join('/') : m[1].split('/')[0];

          switch (pkgName) {
            case 'echarts':
            case 'zrender':
              return 'charts';
            case 'bytemd':
            case '@bytemd/vue-next':
            case '@bytemd/plugin-gfm':
            case '@bytemd/plugin-highlight':
            case '@bytemd/plugin-math':
            case 'highlight.js':
              return 'editor';
            case 'katex':
              return 'katex';
            case '@supabase/supabase-js':
              return 'supabase';
            case 'vue':
            case 'vue-router':
            case 'pinia':
            case '@vueuse/core':
            case '@vueuse/shared':
              return 'vue-vendor';
            default:
              return undefined;
          }
        },
      },
    },
  },
})
