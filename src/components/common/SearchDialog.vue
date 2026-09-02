<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useWikiStore } from '../../store';

const store = useWikiStore();
const router = useRouter();

const searchQuery = ref('');

const toggleDialog = (e: KeyboardEvent) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
    store.toggleSearch();
    if (store.isSearchOpen) {
      setTimeout(() => {
        document.getElementById('searchInput')?.focus();
      }, 50);
    }
  }
  if (e.key === 'Escape' && store.isSearchOpen) {
    store.toggleSearch(false);
  }
};

onMounted(() => {
  window.addEventListener('keydown', toggleDialog);
});

onUnmounted(() => {
  window.removeEventListener('keydown', toggleDialog);
});

const searchResults = computed(() => {
  if (!searchQuery.value.trim()) return [];
  const query = searchQuery.value.toLowerCase();

  const notes = store.notes.filter(n =>
    n.title.toLowerCase().includes(query) ||
    n.content.toLowerCase().includes(query)
  ).map(n => ({ ...n, type: 'note' }));

  return notes;
});

const selectResult = (id: string) => {
  store.toggleSearch(false);
  searchQuery.value = '';
  router.push(`/note/${id}`);
};
</script>

<template>
  <div
    v-if="store.isSearchOpen"
    class="fixed inset-0 z-50 flex items-start justify-center pt-[18vh] px-4 bg-gray-900/40 dark:bg-black/50"
    @click.self="store.toggleSearch(false)"
  >
    <div
      class="w-full max-w-xl n-card shadow-[0_24px_80px_-16px_rgba(15,15,15,0.25)] overflow-hidden flex flex-col"
    >
      <!-- Search Input -->
      <div class="flex items-center gap-3 px-5 py-4 border-b border-[var(--line)]">
        <i class="ri-search-line text-xl text-[var(--accent)]"></i>
        <input
          id="searchInput"
          v-model="searchQuery"
          class="flex-1 bg-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 outline-none text-lg font-medium"
          placeholder="搜索笔记、分类或内容..."
          autocomplete="off"
        />
        <kbd class="text-xs text-gray-400 dark:text-slate-500 border border-[var(--line)] rounded-md px-1.5 py-0.5">ESC</kbd>
      </div>

      <!-- Results -->
      <div class="max-h-[55vh] overflow-y-auto p-2" v-if="searchQuery">
        <div v-if="searchResults.length === 0" class="px-4 py-10 text-center text-gray-500 dark:text-slate-400">
          <i class="ri-search-eye-line text-3xl text-gray-300 dark:text-slate-600 block mb-3"></i>
          未找到包含 "{{ searchQuery }}" 的结果
        </div>

        <div v-else>
          <div class="px-3 py-2 text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-2">
            笔记
            <span class="rounded-full bg-[var(--accent-soft)] text-[var(--accent)] px-1.5 text-[10px] font-semibold">{{ searchResults.length }}</span>
          </div>

          <div
            v-for="res in searchResults"
            :key="res.id"
            class="group flex items-center gap-3.5 px-3 py-3 rounded-lg cursor-pointer transition-colors hover:bg-[var(--hover)]"
            @click="selectResult(res.id)"
          >
            <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent)]">
              <i class="ri-file-text-line text-base"></i>
            </div>
            <div class="flex-1 min-w-0">
              <div class="text-sm font-medium text-gray-900 dark:text-gray-100 truncate group-hover:text-[var(--accent)] transition-colors">
                {{ res.title }}
              </div>
              <div class="text-xs text-gray-400 dark:text-slate-500 truncate mt-0.5">
                {{ res.summary }}
              </div>
            </div>
            <i class="ri-arrow-right-s-line text-gray-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity"></i>
          </div>
        </div>
      </div>

      <div v-else class="px-4 py-12 text-center text-sm text-gray-400 dark:text-slate-500">
        <i class="ri-command-line text-3xl text-gray-300 dark:text-slate-600 block mb-3"></i>
        输入关键词开始全局搜索
        <div class="text-xs text-gray-300 dark:text-slate-600 mt-1">支持笔记标题与正文内容</div>
      </div>

    </div>
  </div>
</template>
