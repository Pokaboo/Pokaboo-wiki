<script setup lang="ts">
import { ref, computed, nextTick } from 'vue';
import { useWikiStore } from '../../store';
import { useRouter, useRoute } from 'vue-router';
import { useDark, useToggle } from '@vueuse/core';

const store = useWikiStore();
const router = useRouter();
const route = useRoute();

const isDark = useDark();
const toggleDark = useToggle(isDark);

// Simple state for expanded folders
const expanded = ref<Record<string, boolean>>({});

// 当前打开的笔记 id（用于高亮）
const currentNoteId = computed(() => route.params.id as string | undefined);

const toggleExpand = (id: string) => {
  expanded.value[id] = !expanded.value[id];
};

const goToNote = (id: string) => {
  router.push(`/note/${id}`);
};

const goToHome = () => {
  router.push('/');
};

// 错误提示状态
const toastState = ref({
  show: false,
  message: '',
  type: 'error' as 'error' | 'success',
});
let toastTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * 显示 toast 提示
 * @param message 提示信息
 * @param type 提示类型
 */
const showToast = (message: string, type: 'error' | 'success' = 'error') => {
  if (toastTimer) clearTimeout(toastTimer);
  toastState.value = { show: true, message, type };
  toastTimer = setTimeout(() => {
    toastState.value.show = false;
  }, 3000);
};

// NOTE: onConfirm 回调不能放在响应式对象中，Vue 3 的深度 reactive 代理会导致函数调用异常
const promptState = ref({
  isOpen: false,
  title: '',
  value: '',
  placeholder: '',
});

// 将回调存储在普通变量中，避免被 Vue 的 Proxy 代理
let promptCallback: ((val: string) => void) | null = null;

const inputRef = ref<HTMLInputElement | null>(null);

const openPrompt = (title: string, placeholder: string, onConfirm: (val: string) => void) => {
  promptCallback = onConfirm;
  promptState.value = {
    isOpen: true,
    title,
    value: '',
    placeholder,
  };
  nextTick(() => {
    if (inputRef.value) inputRef.value.focus();
  });
};

const closePrompt = () => {
  promptState.value.isOpen = false;
  promptCallback = null;
};

const submitPrompt = () => {
  if (promptState.value.value.trim() && promptCallback) {
    promptCallback(promptState.value.value.trim());
  }
  closePrompt();
};

const handleAddModule = () => {
  openPrompt('新建模块', '例如：数据库、面试题...', async (val) => {
    try {
      await store.createModule(val);
      showToast('模块创建成功', 'success');
    } catch (err: any) {
      showToast(err.message || '创建模块失败');
    }
  });
};

const handleAddCategory = (moduleId: string, e: Event) => {
  e.stopPropagation();
  openPrompt('新建分类', '分类名称...', async (val) => {
    try {
      await store.createCategory(moduleId, val);
      expanded.value[moduleId] = true;
      showToast('分类创建成功', 'success');
    } catch (err: any) {
      showToast(err.message || '创建分类失败');
    }
  });
};

const handleAddNote = (categoryId: string, moduleId: string, e: Event) => {
  e.stopPropagation();
  openPrompt('新建笔记', '笔记标题...', async (val) => {
    try {
      const newNote = await store.createNote(categoryId, val);
      expanded.value[moduleId] = true;
      expanded.value[categoryId] = true;
      if (newNote) router.push(`/note/${newNote.id}`);
    } catch (err: any) {
      showToast(err.message || '创建笔记失败');
    }
  });
};

// Compute tree structure for sidebar
const treeData = computed(() => {
  const modules = store.modules.slice().sort((a, b) => a.order - b.order);
  return modules.map(mod => {
    // Top level categories for this module
    const rootCats = store.categories.filter(c => c.moduleId === mod.id && !c.parentId).sort((a, b) => a.order - b.order);
    return {
      ...mod,
      children: rootCats.map(cat => ({
        ...cat,
        notes: store.getNotesByCategory(cat.id)
      }))
    };
  });
});
</script>

<template>
  <aside
    class="relative z-10 w-[264px] h-screen flex flex-col flex-shrink-0 bg-white dark:bg-[#202020] border-r border-[var(--line)] transition-colors duration-300"
  >
    <!-- Brand / Title -->
    <div
      class="h-14 flex items-center gap-2.5 px-4 border-b border-[var(--line)] cursor-pointer hover:bg-[var(--hover)] transition-colors select-none shrink-0"
      @click="goToHome"
    >
      <div class="flex h-7 w-7 items-center justify-center rounded-lg overflow-hidden">
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 48 48" fill="none">
          <rect width="48" height="48" rx="10" fill="#26215C"/>
          <g opacity="0.12">
            <line x1="8" y1="10" x2="40" y2="10" stroke="#7F77DD" stroke-width="0.5"/>
            <line x1="8" y1="16" x2="40" y2="16" stroke="#7F77DD" stroke-width="0.5"/>
            <line x1="8" y1="22" x2="40" y2="22" stroke="#7F77DD" stroke-width="0.5"/>
            <line x1="8" y1="28" x2="40" y2="28" stroke="#7F77DD" stroke-width="0.5"/>
            <line x1="8" y1="34" x2="40" y2="34" stroke="#7F77DD" stroke-width="0.5"/>
            <line x1="8" y1="40" x2="40" y2="40" stroke="#7F77DD" stroke-width="0.5"/>
            <line x1="10" y1="8" x2="10" y2="42" stroke="#7F77DD" stroke-width="0.5"/>
            <line x1="18" y1="8" x2="18" y2="42" stroke="#7F77DD" stroke-width="0.5"/>
            <line x1="26" y1="8" x2="26" y2="42" stroke="#7F77DD" stroke-width="0.5"/>
            <line x1="34" y1="8" x2="34" y2="42" stroke="#7F77DD" stroke-width="0.5"/>
            <line x1="42" y1="8" x2="42" y2="42" stroke="#7F77DD" stroke-width="0.5"/>
          </g>
          <polygon points="10,36 17,12 21,26 25,12 32,36" fill="none" stroke="#AFA9EC" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
          <polygon points="10,36 17,12 21,26 25,12 32,36" fill="none" stroke="#CECBF6" stroke-width="1.2" stroke-linejoin="round" stroke-linecap="round" transform="translate(1.5, 0)"/>
          <circle cx="17" cy="15" r="2" fill="#EEEDFE"/>
          <circle cx="25" cy="15" r="2" fill="#EEEDFE"/>
          <circle cx="21" cy="24" r="1.5" fill="#CECBF6"/>
        </svg>
      </div>
      <span class="font-display font-semibold text-gray-800 dark:text-gray-100 tracking-tight">wiki</span>
    </div>

    <!-- Search / Shortcuts -->
    <div class="px-3 py-3 shrink-0">
      <div
        @click="store.toggleSearch(true)"
        class="flex items-center gap-2 px-2.5 py-2 text-sm text-gray-500 dark:text-slate-400 bg-[var(--hover)] dark:bg-white/10 rounded-lg cursor-pointer hover:bg-[var(--line)] dark:hover:bg-white/15 transition-colors group"
      >
        <i class="ri-search-line text-[15px]"></i>
        <span class="flex-1 text-xs">搜索笔记...</span>
        <kbd class="text-[10px] font-sans border border-[var(--line)] rounded px-1 bg-white dark:bg-white/10">Ctrl K</kbd>
      </div>
    </div>

    <!-- Tree View -->
    <div class="flex-1 overflow-y-auto overflow-x-hidden px-2 pb-4 select-none">
      <div v-for="mod in treeData" :key="mod.id" class="mb-1">
        <!-- Module Header -->
        <div
          class="flex items-center gap-2 px-2 py-1.5 text-[13px] font-semibold text-gray-700 dark:text-gray-200 rounded-lg group cursor-pointer hover:bg-black/[0.04] dark:hover:bg-white/[0.05] transition-colors"
          @click="toggleExpand(mod.id)"
        >
          <i :class="expanded[mod.id] ? 'ri-arrow-down-s-line' : 'ri-arrow-right-s-line'" class="text-[15px] text-gray-300 dark:text-slate-600"></i>
          <i :class="[mod.icon, mod.color]" class="text-base"></i>
          <span class="flex-1 truncate tracking-wide">{{ mod.name }}</span>
          <i
            class="ri-add-line text-[14px] opacity-0 group-hover:opacity-100 text-gray-400 dark:text-slate-500 hover:text-brand-500 transition-all"
            title="新建分类"
            @click="handleAddCategory(mod.id, $event)"
          ></i>
        </div>

        <!-- Categories & Notes -->
        <Transition name="tree">
          <div v-if="expanded[mod.id]" class="ml-[18px] pl-2 border-l border-[var(--line)] mt-0.5 space-y-0.5">
          <div v-for="cat in mod.children" :key="cat.id">
            <div
              class="flex items-center gap-2 px-2 py-1.5 text-[13px] text-gray-600 dark:text-gray-300 rounded-lg cursor-pointer group hover:bg-black/[0.04] dark:hover:bg-white/[0.05] transition-colors"
              @click="toggleExpand(cat.id)"
            >
              <i :class="expanded[cat.id] ? 'ri-arrow-down-s-line' : 'ri-arrow-right-s-line'" class="text-[14px] text-gray-300 dark:text-slate-600"></i>
              <i class="ri-folder-3-line text-[15px] text-[var(--accent)]"></i>
              <span class="truncate flex-1">{{ cat.name }}</span>
              <i
                class="ri-add-line text-[14px] opacity-0 group-hover:opacity-100 text-gray-400 dark:text-slate-500 hover:text-brand-500 transition-all"
                title="新建笔记"
                @click="handleAddNote(cat.id, mod.id, $event)"
              ></i>
            </div>

            <!-- Notes under category -->
            <div v-show="expanded[cat.id]" class="ml-4 space-y-0.5 mt-0.5">
              <div
                v-for="note in cat.notes"
                :key="note.id"
                class="group flex items-center gap-2 px-2 py-[7px] rounded-lg text-[13px] cursor-pointer transition-colors"
                :class="currentNoteId === note.id
                  ? 'bg-[var(--accent-soft)] text-[var(--accent)] dark:text-[#a7aff5] font-medium'
                  : 'text-gray-500 dark:text-slate-400 hover:bg-[var(--hover)] hover:text-gray-800 dark:hover:text-gray-100'"
                @click="goToNote(note.id)"
              >
                <i
                  class="ri-file-text-line text-[14px]"
                  :class="currentNoteId === note.id ? 'text-[var(--accent)]' : 'opacity-60'"
                ></i>
                <span class="truncate">{{ note.title }}</span>
                <span
                  v-if="currentNoteId === note.id"
                  class="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)]"
                ></span>
              </div>
            </div>
          </div>
          </div>
          </Transition>
        </div>

      <!-- Add Module Button -->
      <div
        class="mt-3 flex items-center gap-2 px-2 py-2 text-[13px] text-gray-400 dark:text-slate-500 hover:text-[var(--accent)] rounded-lg cursor-pointer border border-dashed border-[var(--line-strong)] hover:border-[var(--accent)] transition-colors"
        @click="handleAddModule"
      >
        <i class="ri-add-circle-line text-[15px]"></i>
        <span>添加模块</span>
      </div>
    </div>

    <!-- Footer Settings -->
    <div class="p-3 border-t border-[var(--line)] flex items-center gap-2 shrink-0">
      <button
        class="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium text-gray-400 dark:text-slate-500 hover:bg-black/[0.04] dark:hover:bg-white/[0.05] hover:text-gray-600 dark:hover:text-slate-300 rounded-lg transition-colors"
        title="Settings"
      >
        <i class="ri-settings-3-line text-[15px]"></i>
        <span>设置</span>
      </button>
      <button
        @click="toggleDark()"
        class="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium text-gray-400 dark:text-slate-500 hover:bg-black/[0.04] dark:hover:bg-white/[0.05] hover:text-gray-600 dark:hover:text-slate-300 rounded-lg transition-colors"
        :title="isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'"
      >
        <i v-if="!isDark" class="ri-sun-line text-[15px]"></i>
        <i v-else class="ri-moon-line text-[15px]"></i>
        <span>{{ isDark ? '深色' : '浅色' }}</span>
      </button>
    </div>

    <!-- Inline Prompt Modal -->
    <div v-if="promptState.isOpen" class="fixed inset-0 z-[70] flex items-center justify-center bg-gray-900/40 dark:bg-black/50 backdrop-blur-sm p-4" @click.self="closePrompt">
      <div class="n-card w-80 p-5 shadow-xl">
        <div class="h-0.5 w-8 rounded-full bg-[var(--accent)] mb-4"></div>
        <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">{{ promptState.title }}</h3>
        <input
          ref="inputRef"
          v-model="promptState.value"
          @keyup.enter="submitPrompt"
          @keyup.esc="closePrompt"
          type="text"
          :placeholder="promptState.placeholder"
          class="w-full bg-[var(--hover)] dark:bg-white/10 text-gray-900 dark:text-gray-100 text-sm px-3.5 py-2.5 rounded-lg outline-none border border-transparent focus:border-[var(--accent)] transition-colors mb-4"
        />
        <div class="flex justify-end gap-2">
          <button @click="closePrompt" class="px-3.5 py-1.5 text-sm text-gray-500 dark:text-gray-300 hover:bg-[var(--hover)] rounded-lg transition-colors">取消</button>
          <button @click="submitPrompt" class="px-3.5 py-1.5 text-sm font-medium text-white bg-[var(--accent)] hover:bg-[var(--accent-strong)] rounded-lg transition-colors">确认</button>
        </div>
      </div>
    </div>

    <!-- Toast 提示 -->
    <Transition name="toast">
      <div
        v-if="toastState.show"
        class="fixed top-4 left-1/2 -translate-x-1/2 z-[80] px-4 py-2.5 rounded-xl shadow-pop text-sm font-medium backdrop-blur-md"
        :class="toastState.type === 'error'
          ? 'border bg-white dark:bg-[#2a1f24] text-red-600 dark:text-red-300 border-red-200 dark:border-red-400/25'
          : 'border bg-white dark:bg-[#1c2723] text-emerald-600 dark:text-emerald-300 border-emerald-200 dark:border-emerald-400/25'"
      >
        <div class="flex items-center gap-2">
          <i :class="toastState.type === 'error' ? 'ri-error-warning-line' : 'ri-check-line'" class="text-base"></i>
          <span>{{ toastState.message }}</span>
        </div>
      </div>
    </Transition>
  </aside>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translate(-50%, -1rem);
}

.toast-leave-to {
  opacity: 0;
  transform: translate(-50%, -0.5rem);
}

/* 树节点展开动画（展开淡入下滑，收起即时） */
.tree-enter-active {
  transition: opacity 0.22s ease, transform 0.22s ease;
}

.tree-enter-from {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
