<script setup lang="ts">
import { ref } from 'vue';
import { supabase } from '../utils/supabase';
import { useRouter } from 'vue-router';
import { useWikiStore } from '../store';
import { useDark } from '@vueuse/core';

const router = useRouter();
const store = useWikiStore();
useDark();

const email = ref('');
const password = ref('');
const isSignUp = ref(false);
const loading = ref(false);
const errorMsg = ref('');

const handleAuth = async () => {
  try {
    loading.value = true;
    errorMsg.value = '';

    if (isSignUp.value) {
      const { error } = await supabase.auth.signUp({
        email: email.value,
        password: password.value,
      });
      if (error) throw error;
      alert('注册成功！请查收验证邮件（如果开启了邮箱验证），或直接登录。');
      isSignUp.value = false;
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.value,
        password: password.value,
      });
      if (error) throw error;

      // Load data after login
      await store.fetchData();
      router.push('/');
    }
  } catch (error: any) {
    errorMsg.value = error.message;
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="min-h-screen bg-surface-muted dark:bg-surface-deep flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-gray-900 dark:text-gray-100 transition-colors duration-300">
    <div class="sm:mx-auto sm:w-full sm:max-w-md">
      <div class="flex justify-center mb-5">
        <div class="flex h-14 w-14 items-center justify-center rounded-xl bg-[var(--accent)] text-white shadow-lg shadow-gray-900/10">
          <i class="ri-book-read-line text-2xl"></i>
        </div>
      </div>
      <h2 class="text-center font-display text-[26px] font-bold text-gray-900 dark:text-gray-50 tracking-tight">
        {{ isSignUp ? '创建你的知识库账号' : '欢迎回来' }}
      </h2>
      <p class="mt-2 text-center text-sm text-gray-400 dark:text-slate-500">
        {{ isSignUp ? '开始沉淀你的知识体系' : '登录 wiki，继续你的学习足迹' }}
      </p>
    </div>

    <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
      <div class="n-card px-6 sm:px-8 py-8 shadow-[0_2px_16px_-4px_rgba(15,15,15,0.08)]">
        <form class="space-y-5" @submit.prevent="handleAuth">
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">邮箱地址</label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <i class="ri-mail-line text-gray-300 dark:text-slate-600"></i>
              </div>
              <input
                id="email"
                v-model="email"
                type="email"
                required
                class="block w-full pl-10 pr-3 py-2.5 text-sm rounded-lg bg-gray-100 dark:bg-white/10 border border-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 outline-none focus:bg-white dark:focus:bg-white/15 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition-all"
                placeholder="you@example.com"
              >
            </div>
          </div>

          <div>
            <label for="password" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">密码</label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <i class="ri-lock-line text-gray-300 dark:text-slate-600"></i>
              </div>
              <input
                id="password"
                v-model="password"
                type="password"
                required
                class="block w-full pl-10 pr-3 py-2.5 text-sm rounded-lg bg-gray-100 dark:bg-white/10 border border-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 outline-none focus:bg-white dark:focus:bg-white/15 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition-all"
                placeholder="••••••••"
              >
            </div>
          </div>

          <div v-if="errorMsg" class="flex items-center gap-2 text-sm text-red-500 dark:text-red-300 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 py-2.5 px-3.5 rounded-lg">
            <i class="ri-error-warning-line shrink-0"></i>
            <span>{{ errorMsg }}</span>
          </div>

          <div>
            <button
              type="submit"
              :disabled="loading"
              class="w-full flex justify-center items-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold text-white bg-[var(--accent)] hover:bg-[var(--accent-strong)] disabled:opacity-60 disabled:cursor-not-allowed transition-colors active:scale-[0.99]"
            >
              <i v-if="loading" class="ri-loader-4-line animate-spin mr-1"></i>
              {{ isSignUp ? '注 册' : '登 录' }}
            </button>
          </div>
        </form>

        <div class="mt-6 text-center">
          <a
            href="#"
            @click.prevent="isSignUp = !isSignUp"
            class="text-sm font-medium text-[var(--accent)] hover:text-[var(--accent-strong)] transition-colors"
          >
            {{ isSignUp ? '已有账号？去登录' : '没有账号？立即注册' }}
            <i class="ri-arrow-right-s-line align-middle"></i>
          </a>
        </div>
      </div>

      <p class="mt-6 text-center text-xs text-gray-400 dark:text-slate-500 flex items-center justify-center gap-1.5">
        <i class="ri-shield-check-line"></i>
        数据由 Supabase 行级权限保护 · 记录 · 沉淀 · 成长
      </p>
    </div>
  </div>
</template>
