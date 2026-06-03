<template>
  <div class="app-shell">
    <!-- Session 驗證中：顯示全屏載入畫面 -->
    <div v-if="authStore.initializing" class="init-loading">
      <span class="init-spinner" />
      <p>驗證登入狀態…</p>
    </div>

    <template v-else-if="authStore.isAuthenticated">
      <AppSidebar v-if="!isMobile" />
      <div class="main-area">
        <RouterView v-slot="{ Component }">
          <Transition name="page" mode="out-in">
            <component :is="Component" />
          </Transition>
        </RouterView>
      </div>
      <AppBottomNav v-if="isMobile" />
    </template>

    <!-- 未登入：全屏顯示登入頁，不顯示導覽 -->
    <template v-else>
      <div class="main-area">
        <RouterView />
      </div>
    </template>

    <AppToast />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppBottomNav from '@/components/layout/AppBottomNav.vue'
import AppToast from '@/components/ui/AppToast.vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const router = useRouter()

const windowWidth = ref(window.innerWidth)
const isMobile = computed(() => windowWidth.value < 768)

function onResize() {
  windowWidth.value = window.innerWidth
}

// 當 isAuthenticated 變成 false（登出 / 自動登出）時，導向登入頁
watch(
  () => authStore.isAuthenticated,
  (val) => { if (!val) router.push('/auth') },
)

onMounted(async () => {
  window.addEventListener('resize', onResize)
  // 非同步驗證 localStorage session 是否在 Supabase 仍有效
  await authStore.init()
  // init() 若發現 session 無效會呼叫 logout()，
  // 上方的 watch 會自動導向 /auth，此處不需要再做額外判斷
})

onUnmounted(() => window.removeEventListener('resize', onResize))
</script>

<style scoped>
.init-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  gap: 16px;
  color: var(--text-light);
  font-size: 0.9rem;
}

.init-spinner {
  display: inline-block;
  width: 32px;
  height: 32px;
  border: 3px solid var(--border-light);
  border-top-color: var(--mint);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
