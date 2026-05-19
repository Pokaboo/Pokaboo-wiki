<script setup lang="ts">
import { ref, computed, nextTick } from 'vue';
import { useWikiStore } from '../../store';
import { useRouter } from 'vue-router';
import { useDark, useToggle } from '@vueuse/core';

const store = useWikiStore();
const router = useRouter();

const isDark = useDark();
const toggleDark = useToggle(isDark);

// Simple state for expanded folders
const expanded = ref<Record<string, boolean>>({});

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
    
    // A recursive function to build category nodes could be added here.
    // For simplicity, we just map 1 level deep for now in this demo, but the data structure supports more.
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
  <aside class="w-64 h-screen bg-gray-100 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col flex-shrink-0 transition-colors duration-300">
    <!-- User Profile / Title -->
    <div class="h-14 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-800 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors" @click="goToHome">
      <div class="flex items-center gap-2 font-semibold text-gray-800 dark:text-gray-100">
        <div class="w-6 h-6 rounded bg-blue-500 text-white flex items-center justify-center text-xs">
          W
        </div>
        <span>Pokaboo wiki</span>
      </div>
    </div>

    <!-- Search / Shortcuts -->
    <div class="px-3 py-3">
      <div 
        @click="store.toggleSearch(true)"
        class="flex items-center gap-2 px-2 py-1.5 text-sm text-gray-500 dark:text-gray-400 bg-gray-200/50 dark:bg-gray-800/50 rounded-md cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
      >
        <i class="ri-search-line text-[15px]"></i>
        <span class="flex-1 text-xs">Search...</span>
        <kbd class="text-[10px] font-sans border border-gray-300 dark:border-gray-600 rounded px-1 bg-white dark:bg-gray-900 shadow-sm">Ctrl K</kbd>
      </div>
    </div>

    <!-- Tree View -->
    <div class="flex-1 overflow-y-auto overflow-x-hidden px-2 pb-4 select-none">
      <div v-for="mod in treeData" :key="mod.id" class="mb-4">
        <!-- Module Header -->
        <div 
          class="flex items-center gap-1.5 px-2 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider group cursor-pointer"
          @click="toggleExpand(mod.id)"
        >
          <i :class="expanded[mod.id] ? 'ri-arrow-down-s-line' : 'ri-arrow-right-s-line'" class="text-[14px] text-gray-400"></i>
          <i :class="[mod.icon, mod.color]" class="text-[15px]"></i>
          <span class="flex-1">{{ mod.name }}</span>
          <i 
            class="ri-add-line text-[14px] ml-auto opacity-0 group-hover:opacity-100 hover:text-blue-500 transition-opacity" 
            title="新建分类"
            @click="handleAddCategory(mod.id, $event)"
          ></i>
        </div>

        <!-- Categories & Notes -->
        <div v-show="expanded[mod.id]" class="ml-1 pl-3 border-l border-gray-200 dark:border-gray-700/50 mt-1 space-y-0.5">
          <div v-for="cat in mod.children" :key="cat.id">
            <div 
              class="flex items-center gap-1.5 px-2 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-200/50 dark:hover:bg-gray-800/50 rounded cursor-pointer transition-colors group"
              @click="toggleExpand(cat.id)"
            >
              <i :class="expanded[cat.id] ? 'ri-arrow-down-s-line' : 'ri-arrow-right-s-line'" class="text-[14px] text-gray-400"></i>
              <i class="ri-folder-3-line text-[15px] text-blue-400"></i>
              <span class="truncate flex-1">{{ cat.name }}</span>
              <i 
                class="ri-add-line text-[14px] opacity-0 group-hover:opacity-100 text-gray-400 hover:text-blue-500 transition-opacity" 
                title="新建笔记"
                @click="handleAddNote(cat.id, mod.id, $event)"
              ></i>
            </div>

            <!-- Notes under category -->
            <div v-show="expanded[cat.id]" class="ml-4 space-y-0.5 mt-0.5">
              <div 
                v-for="note in cat.notes" 
                :key="note.id"
                class="flex items-center gap-1.5 px-2 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-200/50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-100 rounded cursor-pointer transition-colors"
                @click="goToNote(note.id)"
              >
                <i class="ri-file-text-line text-[14px] opacity-70"></i>
                <span class="truncate">{{ note.title }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <!-- Add Module Button -->
      <div 
        class="mt-2 flex items-center gap-1.5 px-2 py-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-200/50 dark:hover:bg-gray-800/50 rounded cursor-pointer transition-colors"
        @click="handleAddModule"
      >
        <i class="ri-add-line text-[15px]"></i>
        <span>添加模块</span>
      </div>
    </div>

    <!-- Footer Settings -->
    <div class="p-3 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between">
      <button class="p-1.5 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-800 rounded transition-colors flex items-center gap-1" title="Settings">
        <i class="ri-settings-3-line text-[15px]"></i>
        <span class="text-xs font-medium">Settings</span>
      </button>
      <button 
        @click="toggleDark()" 
        class="p-1.5 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-800 rounded transition-colors"
        :title="isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'"
      >
        <i v-if="!isDark" class="ri-sun-line text-[15px]"></i>
        <i v-else class="ri-moon-line text-[15px]"></i>
      </button>
    </div>

    <!-- Inline Prompt Modal -->
    <div v-if="promptState.isOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" @click.self="closePrompt">
      <div class="bg-white dark:bg-gray-900 w-80 p-4 rounded-xl shadow-xl border border-gray-200 dark:border-gray-800 animate-in zoom-in-95 duration-200">
        <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">{{ promptState.title }}</h3>
        <input 
          ref="inputRef"
          v-model="promptState.value"
          @keyup.enter="submitPrompt"
          @keyup.esc="closePrompt"
          type="text"
          :placeholder="promptState.placeholder"
          class="w-full bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm px-3 py-2 rounded-lg outline-none border border-transparent focus:border-blue-500 transition-colors mb-4"
        />
        <div class="flex justify-end gap-2">
          <button @click="closePrompt" class="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">取消</button>
          <button @click="submitPrompt" class="px-3 py-1.5 text-sm text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors">确认</button>
        </div>
      </div>
    </div>

    <!-- Toast 提示 -->
    <Transition name="toast">
      <div 
        v-if="toastState.show" 
        class="fixed top-4 left-1/2 -translate-x-1/2 z-[60] px-4 py-2.5 rounded-lg shadow-lg text-sm font-medium backdrop-blur-sm"
        :class="toastState.type === 'error' 
          ? 'bg-red-500/90 text-white' 
          : 'bg-green-500/90 text-white'"
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
</style>
