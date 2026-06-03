import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { expenseApi } from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import type { Expense, ExpenseCategory } from '@/types'

/** 將 Supabase/網路錯誤轉成使用者友善訊息，並在必要時自動清除無效 session */
function toFriendlyError(e: unknown): Error {
  const msg = e instanceof Error ? e.message : String(e)

  // ── 外鍵違反（error code 23503）：userId 不在 users 表中 ──────────
  // 僅比對 "foreign key" 或 "23503"；不用 "violates" 因為它也會
  // 匹配到 RLS 錯誤，導致誤判並把合法使用者自動登出
  if (msg.includes('foreign key') || msg.includes('23503')) {
    try { useAuthStore().logout() } catch { /* ignore */ }
    return new Error('使用者身分無效，已自動登出，請重新登入')
  }

  // ── Row-Level Security 違反 ───────────────────────────────────────
  // 與 FK 分開處理，不觸發自動登出，改為提示使用者去 Supabase 停用 RLS
  if (msg.includes('row-level security') || msg.includes('security policy')) {
    return new Error(
      '資料庫 RLS 政策阻擋了寫入。\n請至 Supabase → Table Editor → 每張資料表 → 停用 Row Level Security，或執行最新 supabase-schema.sql'
    )
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
