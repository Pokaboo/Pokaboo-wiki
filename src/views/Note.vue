<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useWikiStore } from '../store';
// @ts-ignore
import { Viewer } from '@bytemd/vue-next';
import gfm from '@bytemd/plugin-gfm';
import highlight from '@bytemd/plugin-highlight';
import math from '@bytemd/plugin-math';
import 'highlight.js/styles/github-dark.css'; // You can use standard highlight css
import 'katex/dist/katex.css';
import MarkdownEditor from '../components/common/MarkdownEditor.vue';

const route = useRoute();
const store = useWikiStore();

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
</script>

<template>
  <div class="flex-1 h-full flex flex-col bg-white dark:bg-surface-deep overflow-hidden" v-if="note">
    <!-- Topbar：白底 + 细分割线 -->
    <header class="h-14 shrink-0 flex items-center justify-between px-5 lg:px-7 border-b border-[var(--line)] bg-white dark:bg-surface-deep">
      <div class="flex items-center text-[13px] text-gray-400 dark:text-slate-500 gap-1.5 min-w-0">
        <span class="hover:text-[var(--accent)] cursor-pointer transition-colors whitespace-nowrap">{{ module?.name }}</span>
        <i class="ri-arrow-right-s-line text-[14px]"></i>
        <span class="hover:text-[var(--accent)] cursor-pointer transition-colors whitespace-nowrap">{{ category?.name }}</span>
        <i class="ri-arrow-right-s-line text-[14px]"></i>
        <span class="text-gray-800 dark:text-gray-100 font-medium truncate">{{ note.title }}</span>
      </div>

      <div class="flex items-center gap-4 shrink-0">
        <div class="hidden sm:flex items-center gap-1 text-xs text-gray-400 dark:text-slate-500">
          <i class="ri-file-word-line text-[14px]"></i>
          <span class="tabular-nums">{{ wordCount }} 字</span>
        </div>
        <div class="hidden md:flex items-center gap-1 text-xs text-gray-400 dark:text-slate-500 mr-1">
          <i class="ri-time-line text-[14px]"></i>
          <span>{{ new Date(note.updatedAt).toLocaleDateString() }}</span>
        </div>
        <button
          @click="toggleEdit"
          class="flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-medium transition-colors active:scale-[0.98]"
          :class="isEditing
            ? 'text-white bg-[var(--accent)] hover:bg-[var(--accent-strong)] rounded-lg'
            : 'n-btn-ghost text-gray-600 dark:text-gray-200'" 
        >
          <i :class="isEditing ? 'ri-save-line' : 'ri-edit-line'" class="text-[15px]"></i>
          {{ isEditing ? '保存' : '编辑' }}
        </button>
      </div>
    </header>

    <!-- Main Content Area：无卡纯排版，Notion 式阅读（宽版 900px；编辑态放宽至 1100px） -->
    <div class="flex-1 overflow-y-auto custom-scroll">
      <div
        class="mx-auto px-8 lg:px-10 py-10 lg:py-12 transition-[max-width] duration-300"
        :class="isEditing ? 'max-w-[1100px]' : 'max-w-[900px]'"
      >

        <template v-if="!isEditing">
          <!-- Title -->
          <h1 class="font-display text-[32px] lg:text-4xl font-bold text-gray-900 dark:text-gray-50 tracking-tight leading-tight">
            {{ note.title }}
          </h1>

          <!-- Tags -->
          <div class="flex flex-wrap gap-2 mt-6 mb-10">
            <span
              v-for="tag in note.tags"
              :key="tag"
              class="px-2 py-0.5 rounded-md text-xs bg-[var(--accent-soft)] text-[var(--accent)]"
            >
              #{{ tag }}
            </span>
            <span class="px-2 py-0.5 rounded-md text-xs bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-slate-400">
              难度 {{ note.difficulty }}/5
            </span>
          </div>

          <!-- Viewer -->
          <div class="prose prose-slate dark:prose-invert max-w-none prose-headings:font-semibold prose-a:text-[var(--accent)] hover:prose-a:text-[var(--accent-strong)] prose-code:before:content-none prose-code:after:content-none prose-code:text-[var(--accent)] dark:prose-code:text-[#a7aff5] prose-pre:bg-gray-50 dark:prose-pre:bg-[#0d1117] prose-pre:border prose-pre:border-gray-200 dark:prose-pre:border-gray-800 prose-pre:rounded-lg markdown-body">
            <Viewer :value="note.content" :plugins="plugins" />
          </div>
        </template>

        <template v-else>
          <input
            v-model="editTitle"
            class="w-full bg-transparent font-display text-[32px] lg:text-4xl font-bold text-gray-900 dark:text-gray-50 tracking-tight leading-tight outline-none border-b border-transparent focus:border-[var(--accent)] pb-2 transition-colors"
            placeholder="Note Title"
          />
          <div class="flex flex-wrap items-center gap-x-6 gap-y-3 mt-5 mb-6">
            <div class="flex items-center gap-2">
              <span class="text-sm text-gray-400 dark:text-slate-500">标签</span>
              <input
                v-model="editTags"
                class="bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-gray-100 text-sm px-3 py-1.5 rounded-lg outline-none border border-transparent focus:border-[var(--accent)] transition-colors w-56"
                placeholder="逗号分隔，如: Vue3, 前端"
              />
            </div>
            <div class="flex items-center gap-2">
              <span class="text-sm text-gray-400 dark:text-slate-500">难度</span>
              <select
                v-model="editDifficulty"
                class="bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-gray-100 text-sm px-3 py-1.5 rounded-lg outline-none border border-transparent focus:border-[var(--accent)] transition-colors cursor-pointer"
              >
                <option :value="1">1</option>
                <option :value="2">2</option>
                <option :value="3">3</option>
                <option :value="4">4</option>
                <option :value="5">5</option>
              </select>
            </div>
          </div>
          <div class="rounded-xl overflow-hidden border border-[var(--line)]">
            <MarkdownEditor v-model="editContent" mode="ir" placeholder="开始书写…" />
          </div>
        </template>

      </div>
    </div>
  </div>

  <div v-else class="flex-1 flex flex-col items-center justify-center gap-3 bg-white dark:bg-surface-deep text-gray-400 dark:text-slate-500">
    <i class="ri-file-search-line text-4xl text-gray-300 dark:text-slate-600"></i>
    <span class="text-sm">笔记不存在或已被删除</span>
  </div>
</template>
