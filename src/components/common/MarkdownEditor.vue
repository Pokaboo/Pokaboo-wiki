<script setup lang="ts">
/**
 * MarkdownEditor —— Vditor 的 Vue3 轻封装
 * - 动态加载 vditor（JS + CSS 均按需拆分 chunk），仅在进入编辑态时下载
 * - v-model 双向绑定 markdown 文本
 * - 跟随全局暗色主题（useDark），深浅色自动切换
 * - 静态资源本地化（cdn 指向 /vditor，离线可用）
 */
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useDark } from '@vueuse/core';

type EditMode = 'ir' | 'wysiwyg' | 'sv';

interface Props {
  modelValue?: string;
  placeholder?: string;
  /** 编辑器最小高度（px）。编辑器本身随内容自适应撑高，短文时至少占此高度 */
  minHeight?: number;
  /** 编辑模式：ir=即时渲染(类 Typora) / wysiwyg=所见即所得 / sv=分屏预览 */
  mode?: EditMode;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  placeholder: '',
  minHeight: 640,
  mode: 'ir',
});

const emit = defineEmits<{ (e: 'update:modelValue', value: string): void }>();

// 仅声明用到的 API 面，避免依赖 vditor 复杂类型
interface VditorHandle {
  getValue(): string;
  setValue(markdown: string, clearStack?: boolean): void;
  setTheme(theme: 'dark' | 'classic', contentTheme?: string, codeTheme?: string): void;
  focus(): void;
  destroy(): void;
}

type VditorCtor = new (element: HTMLElement, options: Record<string, unknown>) => VditorHandle;

const isDark = useDark();
const host = ref<HTMLDivElement | null>(null);

let vditor: VditorHandle | null = null;
let vditorCtor: VditorCtor | null = null;
let disposed = false;

/** 裁剪后的工具栏：保留写作高频项，去掉上传/录音/表情等与本产品无关的按钮 */
const TOOLBAR = [
  'headings', 'bold', 'italic', 'strike',
  '|',
  'list', 'ordered-list', 'check',
  '|',
  'quote', 'line', 'code', 'inline-code', 'link', 'table',
  '|',
  'undo', 'redo',
  '|',
  'outline', 'fullscreen',
];

const buildOptions = (): Record<string, unknown> => ({
  value: props.modelValue,
  mode: props.mode,
  height: 'auto', // 内容自适应撑高：长文整页滚动，不被固定高度截断
  minHeight: props.minHeight,
  placeholder: props.placeholder,
  lang: 'zh_CN',
  theme: isDark.value ? 'dark' : 'classic',
  cdn: `${import.meta.env.BASE_URL}vditor`,
  toolbar: TOOLBAR,
  toolbarConfig: { pin: false },
  outline: { enable: false, position: 'right' },
  cache: { enable: false }, // 内容由应用层 store 持久化，禁用 localStorage 缓存防止跨笔记串稿
  counter: { enable: true }, // 底部字数条，增强编辑器完成度
  preview: {
    delay: 200,
    hljs: {
      enable: true,
      lineNumber: false,
      style: isDark.value ? 'atom-one-dark' : 'github',
    },
    math: { engine: 'KaTeX', inlineDigit: true },
    markdown: {
      autoSpace: true,       // 中英文之间自动加空格，中文写作更舒适
      fixTermTypo: true,
      toc: true,
      footnotes: true,
      codeBlockPreview: true,
      mathBlockPreview: true,
      sanitize: true,        // 默认开启 XSS 过滤
    },
    theme: { current: isDark.value ? 'dark' : 'light' },
  },
  input: (value: string) => emit('update:modelValue', value),
  after: () => {
    syncTheme();
    // 内容初始化完成后将光标放至末尾，便于直接继续书写
    if (vditor) vditor.focus();
  },
});

const loadVditor = async () => {
  if (vditorCtor) return;
  const mod = (await import('vditor')) as unknown as { default?: VditorCtor };
  vditorCtor = mod.default ?? (mod as unknown as VditorCtor);
  await import('vditor/dist/index.css');
};

const init = async () => {
  if (!host.value) return;
  try {
    await loadVditor();
    if (disposed || !host.value || !vditorCtor) return;
    vditor = new vditorCtor(host.value, buildOptions());
  } catch (err) {
    if (!disposed) console.error('[MarkdownEditor] Vditor 初始化失败：', err);
  }
};

const syncTheme = () => {
  if (!vditor) return;
  try {
    vditor.setTheme(
      isDark.value ? 'dark' : 'classic',
      isDark.value ? 'dark' : 'light',
      isDark.value ? 'atom-one-dark' : 'github',
    );
  } catch {
    /* 主题切换失败不阻塞编辑，忽略 */
  }
};

onMounted(init);

// 外部值变化（切换笔记 / 重置表单）时同步到编辑器；输入中自身回写相同值会跳过
watch(
  () => props.modelValue,
  (val) => {
    if (!vditor || val === vditor.getValue()) return;
    vditor.setValue(val ?? '', true);
  },
);

// 深浅主题跟随
watch(isDark, () => syncTheme());

onBeforeUnmount(() => {
  disposed = true;
  try {
    vditor?.destroy();
  } catch {
    /* 忽略销毁异常 */
  }
  vditor = null;
});
</script>

<template>
  <div
    ref="host"
    class="markdown-editor"
    :style="{ minHeight: `${minHeight}px` }"
  ></div>
</template>

<style scoped>
/* ===== Vditor 现代化美化定制 =====
   融入外层卡片：去除 vditor 自带的独立边框，由外层 rounded 容器统一承担 */

/* ---- 容器：保持无边框，避免双重描边 ----
   vditor 会把 .vditor 类挂在宿主元素自身，:deep 后代选择器无法命中，
   因此直接选中宿主类名本身 */
.markdown-editor {
  border: none;
  border-radius: 0;
  background: transparent;
}

/* ---- 工具栏：毛玻璃质感 + 按钮胶囊化 ---- */
.markdown-editor :deep(.vditor-toolbar) {
  background: rgba(248, 250, 252, 0.8);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border-bottom: 1px solid rgba(15, 23, 42, 0.06);
  padding: 4px 10px;
}
.markdown-editor :deep(.vditor-toolbar__btn) {
  border-radius: 6px;
  color: #475569;
  transition: background 0.15s ease, color 0.15s ease;
}
.markdown-editor :deep(.vditor-toolbar__btn:hover) {
  background: rgba(15, 23, 42, 0.06);
  color: #0f172a;
}
/* 工具栏分隔线淡化 */
.markdown-editor :deep(.vditor-toolbar__divider) {
  height: 14px;
  background: rgba(15, 23, 42, 0.1);
}

/* ---- 正文排版：Inter 字体 + 居中限宽 + 舒适行高（类 Typora 写作列）---- */
.markdown-editor :deep(.vditor-reset) {
  font-family: 'Inter Variable', -apple-system, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
  font-size: 15px;
  line-height: 1.8;
  color: #1e293b;
  max-width: 960px;
  margin: 0 auto;
  padding: 24px 32px;
}
/* 标题层级：更克制的现代排版 */
.markdown-editor :deep(.vditor-reset h1) {
  font-size: 1.7em;
  font-weight: 700;
  letter-spacing: -0.01em;
  margin: 1.2em 0 0.6em;
}
.markdown-editor :deep(.vditor-reset h2) {
  border-bottom: none;
  font-weight: 600;
  font-size: 1.4em;
  margin: 1.2em 0 0.6em;
}
.markdown-editor :deep(.vditor-reset h3) {
  font-weight: 600;
  font-size: 1.2em;
}
/* 引用块：主题色左边线 + 淡底色 + 圆角 */
.markdown-editor :deep(.vditor-reset blockquote) {
  border-left: 3px solid #6366f1;
  background: rgba(99, 102, 241, 0.04);
  border-radius: 0 8px 8px 0;
  padding: 8px 16px;
  color: #475569;
}
/* 代码块：圆角容器 */
.markdown-editor :deep(.vditor-reset pre) {
  border-radius: 10px;
}
/* 分割线淡化 */
.markdown-editor :deep(.vditor-reset hr) {
  border-color: rgba(15, 23, 42, 0.08);
}
/* 链接颜色跟随主题色 */
.markdown-editor :deep(.vditor-reset a) {
  color: #4f46e5;
  text-decoration-color: rgba(79, 70, 229, 0.3);
}

/* ---- 底部字数条：轻量化 ---- */
.markdown-editor :deep(.vditor-counter) {
  background: transparent;
  color: #94a3b8;
  font-size: 12px;
  padding: 0 12px;
}

/* ---- 弹出面板（标题菜单/提示浮层）圆角与阴影统一 ---- */
.markdown-editor :deep(.vditor-panel) {
  border-radius: 10px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.1);
}

/* ---- 暗色主题适配 ----
   注意：vditor 会把 vditor--dark 类加在本组件根元素自身（而非子元素），
   因此后代选择器 ".markdown-editor .vditor--dark xxx" 永远无法命中。
   这里统一以 html.dark（useDark 切换的全局主题类）作为暗色开关，
   选择器形如 ".dark .markdown-editor :deep(xxx)"，两种模式下均可靠生效。 */
.dark .markdown-editor :deep(.vditor-toolbar) {
  background: rgba(15, 23, 42, 0.6);
  border-bottom-color: rgba(148, 163, 184, 0.12);
}
.dark .markdown-editor :deep(.vditor-toolbar__btn) {
  color: #94a3b8;
}
.dark .markdown-editor :deep(.vditor-toolbar__btn:hover) {
  background: rgba(148, 163, 184, 0.15);
  color: #e2e8f0;
}
.dark .markdown-editor :deep(.vditor-toolbar__divider) {
  background: rgba(148, 163, 184, 0.2);
}
.dark .markdown-editor :deep(.vditor-reset) {
  color: #e2e8f0;
}
.dark .markdown-editor :deep(.vditor-reset blockquote) {
  border-left-color: #818cf8;
  background: rgba(129, 140, 248, 0.08);
  color: #94a3b8;
}
.dark .markdown-editor :deep(.vditor-reset hr) {
  border-color: rgba(148, 163, 184, 0.16);
}
.dark .markdown-editor :deep(.vditor-reset a) {
  color: #a5b4fc;
  text-decoration-color: rgba(165, 180, 252, 0.3);
}
.dark .markdown-editor :deep(.vditor-counter) {
  color: #64748b;
}
.dark .markdown-editor :deep(.vditor-panel) {
  border-color: rgba(148, 163, 184, 0.14);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
}
/* 暗色下弱化行内代码的高亮蓝底，避免与文字对比失衡 */
.dark .markdown-editor :deep(.vditor-reset code:not(.hljs):not(.highlight-chroma)) {
  background: rgba(129, 140, 248, 0.16);
  color: #c7d2fe;
}
/* 暗色下代码块容器与行号区域底色，融入深色面板 */
.dark .markdown-editor :deep(.vditor-reset pre) {
  background: #0f172a;
}
/* IR 模式标题占位标记（H1/H2 前缀）与源码标记使用暗色可读色 */
.dark .markdown-editor :deep(.vditor-reset :is(h1, h2, h3, h4, h5, h6)) {
  color: #e2e8f0;
}
</style>
