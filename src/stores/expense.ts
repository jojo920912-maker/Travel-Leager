import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { expenseApi } from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import type { Expense, ExpenseCategory } from '@/types'

/** 將 Supabase/網路錯誤轉成使用者友善訊息，並在必要時自動清除無效 session */
function toFriendlyError(e: unknown): Error {
  const msg = e instanceof Error ? e.message : String(e)
  // 外鍵違反：userId 在 users 表中不存在（舊 localStorage 殘留 / 帳號不一致）
  // → 自動登出，讓 App.vue 的 watch 將使用者導回登入頁
  if (msg.includes('foreign key') || msg.includes('23503') || msg.includes('violates')) {
    try { useAuthStore().logout() } catch { /* ignore */ }
    return new Error('使用者身分無效，已自動登出，請重新登入')
  }
  // 資料表不存在
  if (msg.includes('does not exist') && msg.includes('relation')) {
    return new Error('資料表尚未建立，請在 Supabase SQL Editor 執行 supabase-schema.sql')
  }
  // 欄位不存在
  if (msg.includes('does not exist') && msg.includes('column')) {
    return new Error('資料表欄位不符，請執行最新版 supabase-schema.sql 更新欄位')
  }
  // 網路失敗
  if (msg.toLowerCase().includes('failed to fetch')) {
    return new Error('無法連線到 Supabase，請確認專案未暫停及網路連線')
  }
  return e instanceof Error ? e : new Error(msg)
}

export const useExpenseStore = defineStore('expense', () => {
  const expenses = ref<Expense[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const totalAmount = computed(() =>
    expenses.value.reduce((sum, e) => sum + e.amount, 0)
  )

  const byCategory = computed(() => {
    const map: Record<string, number> = {}
    for (const e of expenses.value) {
      map[e.category] = (map[e.category] ?? 0) + e.amount
    }
    return map
  })

  const byDate = computed(() => {
    const map: Record<string, Expense[]> = {}
    for (const e of expenses.value) {
      if (!map[e.date]) map[e.date] = []
      map[e.date].push(e)
    }
    return map
  })

  function getUserId() {
    return useAuthStore().currentUser?.id ?? 0
  }

  async function fetchAll(year?: number, month?: number) {
    loading.value = true
    error.value = null
    try {
      const params: Record<string, string> = {}
      if (year !== undefined && month !== undefined) {
        params['date_like'] = `${year}-${String(month).padStart(2, '0')}`
      }
      const res = await expenseApi.getAll(getUserId(), params)
      expenses.value = res.data
    } catch (e) {
      error.value = toFriendlyError(e).message
      console.error(e)
    } finally {
      loading.value = false
    }
  }

  async function addExpense(data: Omit<Expense, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) {
    try {
      const res = await expenseApi.create({ ...data, userId: getUserId() })
      expenses.value.unshift(res.data)
      return res.data
    } catch (e: any) {
      throw toFriendlyError(e)
    }
  }

  async function editExpense(id: number, data: Partial<Expense>) {
    try {
      const res = await expenseApi.update(id, data)
      const idx = expenses.value.findIndex((exp) => exp.id === id)
      if (idx !== -1) expenses.value[idx] = res.data
      return res.data
    } catch (e: any) {
      throw toFriendlyError(e)
    }
  }

  async function removeExpense(id: number) {
    try {
      await expenseApi.delete(id)
      expenses.value = expenses.value.filter((e) => e.id !== id)
    } catch (e: any) {
      throw toFriendlyError(e)
    }
  }

  function filterByCategory(category: ExpenseCategory | 'all') {
    if (category === 'all') return expenses.value
    return expenses.value.filter((e) => e.category === category)
  }

  return {
    expenses,
    loading,
    error,
    totalAmount,
    byCategory,
    byDate,
    fetchAll,
    addExpense,
    editExpense,
    removeExpense,
    filterByCategory,
  }
})
