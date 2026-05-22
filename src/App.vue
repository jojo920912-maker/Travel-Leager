<template>
  <div class="app-shell">
    <template v-if="authStore.isAuthenticated">
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
import { computed, onMounted, onUnmounted, ref } from 'vue'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppBottomNav from '@/components/layout/AppBottomNav.vue'
import AppToast from '@/components/ui/AppToast.vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

const windowWidth = ref(window.innerWidth)
const isMobile = computed(() => windowWidth.value < 768)

function onResize() {
  windowWidth.value = window.innerWidth
}
onMounted(() => window.addEventListener('resize', onResize))
onUnmounted(() => window.removeEventListener('resize', onResize))
</script>
