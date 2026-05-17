<script setup lang="ts">
import { useDark } from '@vueuse/core';

// This initializes dark mode automatically from system or localStorage
const isDark = useDark();
</script>

<template>
  <router-view />
</template>

<style>
/* Global styles can be added here, though we mainly use Tailwind */
</style>
