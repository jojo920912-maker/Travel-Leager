import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { expenseApi } from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import type { Expense, ExpenseCategory } from '@/types'

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
      error.value = '載入失敗，請確認 API 服務正在執行'
      console.error(e)
    } finally {
      loading.value = false
    }
  }

  async function addExpense(data: Omit<Expense, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) {
    const res = await expenseApi.create({ ...data, userId: getUserId() })
    expenses.value.unshift(res.data)
    return res.data
  }

  async function editExpense(id: number, data: Partial<Expense>) {
    const res = await expenseApi.update(id, data)
    const idx = expenses.value.findIndex((e) => e.id === id)
    if (idx !== -1) expenses.value[idx] = res.data
    return res.data
  }

  async function removeExpense(id: number) {
    await expenseApi.delete(id)
    expenses.value = expenses.value.filter((e) => e.id !== id)
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
