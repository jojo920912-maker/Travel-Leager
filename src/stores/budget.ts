import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { budgetApi } from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import { useExpenseStore } from '@/stores/expense'
import { useTripStore } from '@/stores/trip'
import type { Budget, ExpenseCategory } from '@/types'

export const useBudgetStore = defineStore('budget', () => {
  const budgets = ref<Budget[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  function getUserId() {
    return useAuthStore().currentUser?.id ?? 0
  }

  // ─── 本月預算物件 ──────────────────────────────────────────
  const currentMonthBudget = computed(() => {
    const now = new Date()
    const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    return budgets.value.find((b) => b.month === ym) ?? null
  })

  // ─── 依月份計算花費狀況（記帳 + 旅行）──────────────────────
  function getBudgetStatus(month: string) {
    const budget = budgets.value.find((b) => b.month === month)
    if (!budget) return null

    const expenseStore = useExpenseStore()
    const tripStore = useTripStore()

    // 日常記帳花費
    const dailyExpenses = expenseStore.expenses.filter((e) => e.date.startsWith(month))
    const dailySpent = dailyExpenses.reduce((s, e) => s + e.amount, 0)

    // 旅行花費（跨所有旅程）
    const tripSpent = tripStore.monthTripExpenses
      .filter((e) => e.date.startsWith(month))
      .reduce((s, e) => s + e.amount, 0)

    const totalSpent = dailySpent + tripSpent

    // 記帳分類花費
    const categorySpent: Partial<Record<ExpenseCategory, number>> = {}
    for (const e of dailyExpenses) {
      categorySpent[e.category] = (categorySpent[e.category] ?? 0) + e.amount
    }

    return { budget, dailySpent, tripSpent, totalSpent, categorySpent }
  }

  // ─── API 操作 ──────────────────────────────────────────────
  async function fetchAll() {
    loading.value = true
    error.value = null
    try {
      const res = await budgetApi.getAll(getUserId())
      budgets.value = res.data
    } catch (e) {
      error.value = '載入預算失敗'
      console.error(e)
    } finally {
      loading.value = false
    }
  }

  async function fetchByMonth(month: string) {
    loading.value = true
    error.value = null
    try {
      const res = await budgetApi.getByMonth(getUserId(), month)
      const existing = budgets.value.findIndex((b) => b.month === month)
      if (res.data.length) {
        if (existing !== -1) budgets.value[existing] = res.data[0]
        else budgets.value.push(res.data[0])
      }
    } catch (e) {
      error.value = '載入預算失敗'
      console.error(e)
    } finally {
      loading.value = false
    }
  }

  async function saveBudget(
    month: string,
    total: number,
    dailyBudget: number,
    tripBudget: number,
    categories: Partial<Record<ExpenseCategory, number>>,
  ) {
    const existing = budgets.value.find((b) => b.month === month)
    if (existing) {
      const res = await budgetApi.update(existing.id, { total, dailyBudget, tripBudget, categories })
      const idx = budgets.value.findIndex((b) => b.id === existing.id)
      if (idx !== -1) budgets.value[idx] = res.data
      return res.data
    } else {
      const res = await budgetApi.create({
        userId: getUserId(),
        month,
        total,
        dailyBudget,
        tripBudget,
        categories,
      })
      budgets.value.push(res.data)
      return res.data
    }
  }

  // 快速更新單一分配（從記帳/旅行頁呼叫）
  async function updateAllocation(month: string, type: 'daily' | 'trip', amount: number) {
    const existing = budgets.value.find((b) => b.month === month)
    if (existing) {
      const patch = type === 'daily'
        ? { dailyBudget: amount }
        : { tripBudget: amount }
      const res = await budgetApi.update(existing.id, patch)
      const idx = budgets.value.findIndex((b) => b.id === existing.id)
      if (idx !== -1) budgets.value[idx] = res.data
      return res.data
    } else {
      // 沒有該月預算 → 建立新的
      return saveBudget(
        month,
        0,
        type === 'daily' ? amount : 0,
        type === 'trip' ? amount : 0,
        {},
      )
    }
  }

  async function removeBudget(id: number) {
    await budgetApi.delete(id)
    budgets.value = budgets.value.filter((b) => b.id !== id)
  }

  return {
    budgets,
    loading,
    error,
    currentMonthBudget,
    getBudgetStatus,
    fetchAll,
    fetchByMonth,
    saveBudget,
    updateAllocation,
    removeBudget,
  }
})
