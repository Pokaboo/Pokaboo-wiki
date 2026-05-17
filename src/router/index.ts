import { createRouter, createWebHistory } from 'vue-router';
import MainLayout from '../components/layout/MainLayout.vue';
import { supabase } from '../utils/supabase';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: MainLayout,
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          name: 'Home',
          component: () => import('../views/Home.vue'),
        },
        {
          path: 'note/:id',
          name: 'Note',
          component: () => import('../views/Note.vue'),
        }
      ]
    },
    {
      path: '/login',
      name: 'Login',
      component: () => import('../views/Login.vue')
    }
  ],
});

router.beforeEach(async (to, _from, next) => {
  if (to.meta.requiresAuth) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      next('/login');
    } else {
      next();
    }
  } else {
    next();
  }
});

export default router;
