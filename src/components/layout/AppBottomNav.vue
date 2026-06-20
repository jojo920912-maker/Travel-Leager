<template>
  <nav class="bottom-nav" role="navigation" aria-label="主選單">
    <RouterLink
      v-for="item in navItems"
      :key="item.to"
      :to="item.to"
      class="bottom-item"
      :class="{ active: isActive(item.to) }"
      :aria-label="item.label"
    >
      <component :is="item.icon" :size="22" />
      <span>{{ item.label }}</span>
    </RouterLink>

    <!-- Avatar + logout -->
    <button class="bottom-item bottom-logout" @click="handleLogout" aria-label="登出">
      <div class="mini-avatar">{{ avatarLetter }}</div>
      <span>登出</span>
    </button>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { LayoutDashboard, Map, PiggyBank } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const navItems = [
  { to: '/',       label: '總覽', icon: LayoutDashboard },
  { to: '/trips',  label: '旅行', icon: Map             },
  { to: '/budget', label: '預算', icon: PiggyBank       },
]

const avatarLetter = computed(() => {
  const name = authStore.currentUser?.displayName ?? authStore.currentUser?.username ?? '?'
  return name[0].toUpperCase()
})

function isActive(path: string) {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}

function handleLogout() {
  authStore.logout()
  router.push('/auth')
}
</script>

<style scoped>
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: var(--nav-h);
  background: var(--card);
  border-top: 1px solid var(--border-light);
  display: flex;
  align-items: center;
  z-index: 100;
  box-shadow: 0 -4px 16px rgba(0,0,0,0.06);
}

.bottom-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  color: var(--text-muted);
  text-decoration: none;
  font-size: 0.7rem;
  font-weight: 500;
  padding: 8px 4px;
  transition: all var(--transition);
}

.bottom-item:hover,
.bottom-item.active {
  color: var(--mint-dark);
}

.bottom-item.active {
  font-weight: 600;
}

.bottom-logout {
  background: none;
  border: none;
  cursor: pointer;
  font-family: var(--font);
}

.bottom-logout:hover { color: #DC2626; }

.mini-avatar {
  width: 22px;
  height: 22px;
  border-radius: var(--radius-full);
  background: linear-gradient(135deg, var(--mint), var(--mint-dark));
  color: white;
  font-weight: 700;
  font-size: 0.65rem;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
