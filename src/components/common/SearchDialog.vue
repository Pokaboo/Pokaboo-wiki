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
  <div v-if="store.isSearchOpen" class="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] bg-gray-900/50 dark:bg-black/60 backdrop-blur-sm" @click.self="store.toggleSearch(false)">
    <div class="w-full max-w-xl bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col">
      
      <!-- Search Input -->
      <div class="flex items-center px-4 py-3 border-b border-gray-200 dark:border-gray-800">
        <i class="ri-search-line text-xl text-gray-400 mr-3"></i>
        <input 
          id="searchInput"
          v-model="searchQuery"
          class="flex-1 bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 outline-none text-lg"
          placeholder="搜索笔记、分类或内容..."
          autocomplete="off"
        />
        <kbd class="text-xs font-sans text-gray-400 border border-gray-200 dark:border-gray-700 rounded px-1.5 py-0.5">ESC</kbd>
      </div>

      <!-- Results -->
      <div class="max-h-[60vh] overflow-y-auto p-2" v-if="searchQuery">
        <div v-if="searchResults.length === 0" class="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
          未找到包含 "{{ searchQuery }}" 的结果
        </div>
        
        <div v-else>
          <div class="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            笔记
          </div>
          <div 
            v-for="res in searchResults" 
            :key="res.id"
            class="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800/80 transition-colors"
            @click="selectResult(res.id)"
          >
            <div class="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded text-blue-600 dark:text-blue-400 shrink-0 flex items-center justify-center">
              <i class="ri-file-text-line text-base"></i>
            </div>
            <div class="flex-1 min-w-0">
              <div class="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                {{ res.title }}
              </div>
              <div class="text-xs text-gray-500 dark:text-gray-400 truncate">
                {{ res.summary }}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div v-else class="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
        输入关键词开始全局搜索...
      </div>
      
    </div>
  </div>
</template>
