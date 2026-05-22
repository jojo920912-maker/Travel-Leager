<template>
  <aside class="sidebar">
    <div class="sidebar-logo">
      <span class="logo-icon">✈️</span>
      <span class="logo-text">旅途記帳</span>
    </div>

    <nav class="sidebar-nav" role="navigation" aria-label="主選單">
      <RouterLink
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        class="nav-item"
        :class="{ active: isActive(item.to) }"
        :aria-label="item.label"
        :title="`${item.label} (${item.key})`"
      >
        <component :is="item.icon" :size="20" />
        <span>{{ item.label }}</span>
        <span class="nav-key kbd">{{ item.key }}</span>
      </RouterLink>
    </nav>

    <!-- User info + logout -->
    <div class="sidebar-user">
      <div class="user-info">
        <div class="user-avatar">{{ avatarLetter }}</div>
        <div class="user-text">
          <span class="user-name">{{ authStore.currentUser?.displayName }}</span>
          <span class="user-id">@{{ authStore.currentUser?.username }}</span>
        </div>
      </div>
      <button
        class="logout-btn"
        @click="handleLogout"
        title="登出"
        aria-label="登出"
      >
        <LogOut :size="16" />
      </button>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { LayoutDashboard, Wallet, Map, LogOut } from 'lucide-vue-next'
import { useKeyboard } from '@/composables/useKeyboard'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const navItems = [
  { to: '/',         label: '總覽',  icon: LayoutDashboard, key: '1' },
  { to: '/expenses', label: '記帳',  icon: Wallet,           key: '2' },
  { to: '/trips',    label: '旅行',  icon: Map,              key: '3' },
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

useKeyboard({
  '1': () => router.push('/'),
  '2': () => router.push('/expenses'),
  '3': () => router.push('/trips'),
})
</script>

<style scoped>
.sidebar {
  width: var(--sidebar-w);
  min-height: 100dvh;
  background: var(--card);
  border-right: 1px solid var(--border-light);
  display: flex;
  flex-direction: column;
  position: sticky;
  top: 0;
  height: 100dvh;
  overflow: hidden;
}

.sidebar-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 24px 20px 20px;
  border-bottom: 1px solid var(--border-light);
}

.logo-icon { font-size: 1.5rem; }

.logo-text {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text);
  letter-spacing: -0.01em;
}

.sidebar-nav {
  flex: 1;
  overflow-y: auto;
  padding: 16px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: var(--radius);
  color: var(--text-light);
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all var(--transition);
  position: relative;
}

.nav-item:hover {
  background: var(--mint-pale);
  color: var(--mint-dark);
}

.nav-item.active {
  background: var(--mint-pale);
  color: var(--mint-dark);
  font-weight: 600;
}

.nav-key {
  margin-left: auto;
  opacity: 0;
  transition: opacity var(--transition);
}

.nav-item:hover .nav-key,
.nav-item.active .nav-key {
  opacity: 1;
}

/* User section */
.sidebar-user {
  background: linear-gradient(135deg, var(--mint-pale) 0%, #E4F4F2 100%);
  border-top: 1.5px solid var(--mint-light);
  border-right: 1.5px solid var(--mint-light);
  padding: 14px 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
}

.user-avatar {
  width: 38px;
  height: 38px;
  border-radius: var(--radius-full);
  background: linear-gradient(135deg, var(--mint), var(--mint-dark));
  color: white;
  font-weight: 700;
  font-size: 0.95rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(92,200,190,0.4);
}

.user-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.user-name {
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-id {
  font-size: 0.72rem;
  color: var(--mint-dark);
  opacity: 0.7;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.logout-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border: none;
  background: rgba(255,255,255,0.6);
  border-radius: var(--radius);
  color: var(--text-light);
  cursor: pointer;
  transition: all var(--transition);
  flex-shrink: 0;
}

.logout-btn:hover {
  background: #FEE2E2;
  color: #DC2626;
  transform: scale(1.08);
}
</style>
