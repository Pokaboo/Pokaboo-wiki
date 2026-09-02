<script setup lang="ts">
import { onMounted } from 'vue';
import { useWikiStore } from '../../store';
import Sidebar from './Sidebar.vue';
import SearchDialog from '../common/SearchDialog.vue';

const store = useWikiStore();

onMounted(() => {
  store.fetchData();
});
</script>

<template>
  <div class="flex h-screen w-full overflow-hidden bg-surface-muted dark:bg-surface-deep text-gray-900 dark:text-gray-100 font-sans">
    <Sidebar />

    <main class="flex-1 h-full overflow-hidden flex flex-col">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
      <SearchDialog />
    </main>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
