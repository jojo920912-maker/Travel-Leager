import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/auth',
      name: 'auth',
      component: () => import('@/views/AuthView.vue'),
      meta: { public: true },
    },
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/HomeView.vue'),
    },
    {
      path: '/trips',
      name: 'trips',
      component: () => import('@/views/TripView.vue'),
    },
    {
      path: '/trips/:id',
      name: 'trip-detail',
      component: () => import('@/views/TripDetailView.vue'),
      props: (route) => ({ id: Number(route.params.id) }),
    },
    {
      path: '/budget',
      name: 'budget',
      component: () => import('@/views/BudgetView.vue'),
    },
  ],
})

router.beforeEach((to) => {
  const authStore = useAuthStore()
  // 若未登入且目標不是公開路由 → 導向登入頁
  if (!to.meta.public && !authStore.isAuthenticated) {
    return { name: 'auth' }
  }
  // 若已登入卻訪問登入頁 → 導向首頁
  if (to.name === 'auth' && authStore.isAuthenticated) {
    return { name: 'home' }
  }
})

export default router
