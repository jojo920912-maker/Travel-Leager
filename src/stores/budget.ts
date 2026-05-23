import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { budgetApi } from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import { useExpenseStore } from '@/stores/expense'
import type { Budget, ExpenseCategory } from '@/types'

export const useBudgetStore = defineStore('budget', () => {
  const budgets = ref<Budget[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  function getUserId() {
    return useAuthStore().currentUser?.id ?? 0
  }

  // 目前顯示月份的預算
  const currentMonthBudget = computed(() => {
    const now = new Date()
    const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    return budgets.value.find((b) => b.month === ym) ?? null
  })

  // 某個月份下各分類實際花費 vs 預算的比較
  function getBudgetStatus(month: string) {
    const budget = budgets.value.find((b) => b.month === month)
    if (!budget) return null

    const expenseStore = useExpenseStore()
    const monthExpenses = expenseStore.expenses.filter((e) => e.date.startsWith(month))
    const totalSpent = monthExpenses.reduce((s, e) => s + e.amount, 0)

    const categorySpent: Partial<Record<ExpenseCategory, number>> = {}
    for (const e of monthExpenses) {
      categorySpent[e.category] = (categorySpent[e.category] ?? 0) + e.amount
    }

    return { budget, totalSpent, categorySpent }
  }

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
      // 更新或插入該月預算
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
    categories: Partial<Record<ExpenseCategory, number>>,
  ) {
    const existing = budgets.value.find((b) => b.month === month)
    if (existing) {
      const res = await budgetApi.update(existing.id, { total, categories })
      const idx = budgets.value.findIndex((b) => b.id === existing.id)
      if (idx !== -1) budgets.value[idx] = res.data
      return res.data
    } else {
      const res = await budgetApi.create({ userId: getUserId(), month, total, categories })
      budgets.value.push(res.data)
      return res.data
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
    removeBudget,
  }
})
