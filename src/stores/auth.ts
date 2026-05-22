import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '@/services/api'
import type { SafeUser } from '@/types'

const STORAGE_KEY = 'travel_ledger_user'

export const useAuthStore = defineStore('auth', () => {
  const currentUser = ref<SafeUser | null>(null)

  const isAuthenticated = computed(() => !!currentUser.value)

  /** 從 localStorage 恢復登入狀態 */
  function restore() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) currentUser.value = JSON.parse(raw) as SafeUser
    } catch {
      localStorage.removeItem(STORAGE_KEY)
    }
  }

  /** 登入 */
  async function login(username: string, password: string) {
    const res = await authApi.findByUsername(username.trim())
    const match = res.data.find((u) => u.password === password)
    if (!match) throw new Error('帳號或密碼錯誤')
    const { password: _pw, ...safe } = match
    currentUser.value = safe
    localStorage.setItem(STORAGE_KEY, JSON.stringify(safe))
  }

  /** 註冊 */
  async function register(username: string, password: string, displayName: string) {
    const existing = await authApi.findByUsername(username.trim())
    if (existing.data.length) throw new Error('此使用者名稱已被使用')
    const res = await authApi.register({
      username: username.trim(),
      password,
      displayName: displayName.trim() || username.trim(),
      createdAt: new Date().toISOString(),
    })
    const { password: _pw, ...safe } = res.data
    currentUser.value = safe
    localStorage.setItem(STORAGE_KEY, JSON.stringify(safe))
  }

  /** 登出 */
  function logout() {
    currentUser.value = null
    localStorage.removeItem(STORAGE_KEY)
  }

  return { currentUser, isAuthenticated, restore, login, register, logout }
})
