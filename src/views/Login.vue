<script setup lang="ts">
import { ref } from 'vue';
import { supabase } from '../utils/supabase';
import { useRouter } from 'vue-router';
import { useWikiStore } from '../store';
import { Lock, Mail, Loader2 } from 'lucide-vue-next'; // Let's use remixicon instead of lucide
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
  <div class="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 transition-colors duration-300">
    <div class="sm:mx-auto sm:w-full sm:max-w-md">
      <div class="mx-auto w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center text-white shadow-lg mb-6">
        <i class="ri-book-read-line text-2xl"></i>
      </div>
      <h2 class="mt-2 text-center text-3xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">
        {{ isSignUp ? '创建您的知识库账号' : '登录个人知识库' }}
      </h2>
    </div>

    <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
      <div class="bg-white dark:bg-gray-900 py-8 px-4 shadow sm:rounded-2xl sm:px-10 border border-gray-200 dark:border-gray-800">
        <form class="space-y-6" @submit.prevent="handleAuth">
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-300"> 邮箱地址 </label>
            <div class="mt-1 relative rounded-md shadow-sm">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <i class="ri-mail-line text-gray-400"></i>
              </div>
              <input 
                id="email" 
                v-model="email" 
                type="email" 
                required 
                class="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-lg py-2.5 outline-none border transition-colors" 
                placeholder="you@example.com"
              >
            </div>
          </div>

          <div>
            <label for="password" class="block text-sm font-medium text-gray-700 dark:text-gray-300"> 密码 </label>
            <div class="mt-1 relative rounded-md shadow-sm">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <i class="ri-lock-line text-gray-400"></i>
              </div>
              <input 
                id="password" 
                v-model="password" 
                type="password" 
                required 
                class="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-lg py-2.5 outline-none border transition-colors" 
                placeholder="••••••••"
              >
            </div>
          </div>

          <div v-if="errorMsg" class="text-red-500 text-sm text-center bg-red-50 dark:bg-red-900/30 py-2 rounded-lg">
            {{ errorMsg }}
          </div>

          <div>
            <button 
              type="submit" 
              :disabled="loading"
              class="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
            >
              <i v-if="loading" class="ri-loader-4-line animate-spin mr-2"></i>
              {{ isSignUp ? '注 册' : '登 录' }}
            </button>
          </div>
        </form>

        <div class="mt-6 text-center">
          <a href="#" @click.prevent="isSignUp = !isSignUp" class="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors">
            {{ isSignUp ? '已有账号？去登录' : '没有账号？立即注册' }}
          </a>
        </div>
      </div>
    </div>
  </div>
</template>
