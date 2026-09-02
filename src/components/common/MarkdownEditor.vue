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
  counter: { enable: false },
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
/* 融入外层卡片：去除 vditor 自带的独立边框，由外层 rounded 容器统一承担 */
.markdown-editor :deep(.vditor) {
  border: none;
  border-radius: 0;
}
</style>
