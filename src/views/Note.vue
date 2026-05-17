<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useWikiStore } from '../store';
// @ts-ignore
import { Editor, Viewer } from '@bytemd/vue-next';
import gfm from '@bytemd/plugin-gfm';
import highlight from '@bytemd/plugin-highlight';
import math from '@bytemd/plugin-math';
import 'highlight.js/styles/github-dark.css'; // You can use standard highlight css
import 'katex/dist/katex.css';
import { useDark } from '@vueuse/core';

const route = useRoute();
const store = useWikiStore();
const isDark = useDark();

const plugins = [
  gfm(),
  highlight(),
  math(),
];

const noteId = computed(() => route.params.id as string);
const note = computed(() => store.notes.find(n => n.id === noteId.value));
const category = computed(() => store.categories.find(c => c.id === note.value?.categoryId));
const module = computed(() => store.modules.find(m => m.id === category.value?.moduleId));

const wordCount = computed(() => {
  if (!note.value?.content) return 0;
  // Remove markdown formatting characters and whitespace for a simple character/word count
  const cleanText = note.value.content.replace(/[#*`~_\[\]()!>\-\n\r\s]/g, '');
  return cleanText.length;
});

const isEditing = ref(false);
const editTitle = ref('');
const editContent = ref('');
const editTags = ref('');
const editDifficulty = ref<1|2|3|4|5>(1);

watch(note, (newNote) => {
  if (newNote) {
    editTitle.value = newNote.title;
    editContent.value = newNote.content;
    editTags.value = newNote.tags.join(', ');
    editDifficulty.value = newNote.difficulty;
    isEditing.value = false;
  }
}, { immediate: true });

const toggleEdit = () => {
  if (isEditing.value) {
    // Save
    if (note.value) {
      store.updateNote(note.value.id, {
        title: editTitle.value,
        content: editContent.value,
        summary: editContent.value.substring(0, 100).replace(/\n/g, ' ') + '...',
        tags: editTags.value.split(',').map(t => t.trim()).filter(t => t),
        difficulty: editDifficulty.value
      });
    }
  }
  isEditing.value = !isEditing.value;
};

const handleChange = (v: string) => {
  editContent.value = v;
};
</script>

<template>
  <div class="flex-1 h-full flex flex-col bg-white dark:bg-gray-950 overflow-hidden" v-if="note">
    <!-- Topbar (Breadcrumbs & Actions) -->
    <header class="h-14 shrink-0 flex items-center justify-between px-6 border-b border-gray-200 dark:border-gray-800">
      <div class="flex items-center text-sm text-gray-500 dark:text-gray-400 gap-2">
        <span class="hover:text-gray-900 dark:hover:text-gray-100 cursor-pointer transition-colors">{{ module?.name }}</span>
        <i class="ri-arrow-right-s-line text-[14px]"></i>
        <span class="hover:text-gray-900 dark:hover:text-gray-100 cursor-pointer transition-colors">{{ category?.name }}</span>
        <i class="ri-arrow-right-s-line text-[14px]"></i>
        <span class="text-gray-900 dark:text-gray-100 font-medium truncate max-w-[200px]">{{ note.title }}</span>
      </div>
      
      <div class="flex items-center gap-4">
        <div class="text-xs text-gray-400 flex items-center gap-1">
          <i class="ri-file-word-line text-[14px]"></i>
          <span>{{ wordCount }} 字</span>
        </div>
        <div class="text-xs text-gray-400 flex items-center gap-1 mr-2">
          <i class="ri-time-line text-[14px]"></i>
          <span>{{ new Date(note.updatedAt).toLocaleDateString() }}</span>
        </div>
        <button 
          @click="toggleEdit"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
          :class="isEditing ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'"
        >
          <i :class="isEditing ? 'ri-save-line' : 'ri-edit-line'" class="text-[15px]"></i>
          {{ isEditing ? 'Save' : 'Edit' }}
        </button>
      </div>
    </header>

    <!-- Main Content Area -->
    <div class="flex-1 overflow-y-auto w-full flex justify-center relative custom-scroll">
      <div class="w-full max-w-4xl px-8 py-10 pb-32">
        
        <template v-if="!isEditing">
          <!-- Title -->
          <h1 class="text-4xl font-extrabold text-gray-900 dark:text-gray-100 mb-6 tracking-tight leading-tight">
            {{ note.title }}
          </h1>
          
          <!-- Tags -->
          <div class="flex flex-wrap gap-2 mb-10">
            <span 
              v-for="tag in note.tags" 
              :key="tag"
              class="px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800/50"
            >
              #{{ tag }}
            </span>
            <span class="px-2.5 py-1 rounded-md text-xs font-medium bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 border border-green-100 dark:border-green-800/50">
              难度: {{ note.difficulty }}
            </span>
          </div>

          <!-- Viewer -->
          <div class="prose prose-slate dark:prose-invert max-w-none prose-headings:font-semibold prose-a:text-blue-500 hover:prose-a:text-blue-600 prose-pre:bg-gray-50 dark:prose-pre:bg-[#0d1117] prose-pre:border prose-pre:border-gray-200 dark:prose-pre:border-gray-800 markdown-body">
            <Viewer :value="note.content" :plugins="plugins" />
          </div>
        </template>

        <template v-else>
          <input 
            v-model="editTitle"
            class="w-full bg-transparent text-4xl font-extrabold text-gray-900 dark:text-gray-100 mb-4 tracking-tight leading-tight outline-none border-b border-transparent focus:border-blue-500 pb-2 transition-colors"
            placeholder="Note Title"
          />
          <div class="flex items-center gap-4 mb-6">
            <div class="flex items-center gap-2">
              <span class="text-sm text-gray-500 dark:text-gray-400">标签:</span>
              <input 
                v-model="editTags"
                class="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm px-3 py-1.5 rounded outline-none border border-transparent focus:border-blue-500 transition-colors w-64"
                placeholder="例如: Vue3, 前端 (用逗号分隔)"
              />
            </div>
            <div class="flex items-center gap-2">
              <span class="text-sm text-gray-500 dark:text-gray-400">难度:</span>
              <select 
                v-model="editDifficulty"
                class="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm px-3 py-1.5 rounded outline-none border border-transparent focus:border-blue-500 transition-colors"
              >
                <option :value="1">1</option>
                <option :value="2">2</option>
                <option :value="3">3</option>
                <option :value="4">4</option>
                <option :value="5">5</option>
              </select>
            </div>
          </div>
          <div class="bytemd-wrapper" :class="{ 'dark': isDark }">
            <Editor 
              :value="editContent" 
              :plugins="plugins" 
              @change="handleChange" 
              class="h-[600px] shadow-sm rounded-lg overflow-hidden border border-gray-200 dark:border-gray-800"
            />
          </div>
        </template>
        
      </div>
    </div>
  </div>
  
  <div v-else class="flex-1 flex items-center justify-center text-gray-400">
    Note not found
  </div>
</template>

<style>
/* Override bytemd dark mode if needed, it uses CSS variables */
.dark .bytemd {
  background-color: #111827; /* gray-900 */
  color: #f3f4f6;
  border: none;
}
.dark .bytemd-toolbar {
  background-color: #1f2937;
  border-bottom: 1px solid #374151;
}
.dark .bytemd-toolbar-icon:hover {
  background-color: #374151;
}
.dark .bytemd-preview {
  background-color: #030712; /* gray-950 */
}
</style>
