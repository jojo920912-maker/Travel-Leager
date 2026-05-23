import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { tripApi, memberApi, tripExpenseApi } from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import type { Trip, TripMember, TripExpense, Balance, Settlement } from '@/types'

export const useTripStore = defineStore('trip', () => {
  const trips = ref<Trip[]>([])
  const currentTrip = ref<Trip | null>(null)
  const members = ref<TripMember[]>([])
  const tripExpenses = ref<TripExpense[]>([])
  // 跨所有旅程的當月支出（供預算計算用）
  const monthTripExpenses = ref<TripExpense[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const totalTripExpense = computed(() =>
    tripExpenses.value.reduce((sum, e) => sum + e.amount, 0)
  )

  const balances = computed((): Balance[] => {
    if (!members.value.length) return []

    const paid: Record<number, number> = {}
    const shouldPay: Record<number, number> = {}

    for (const m of members.value) {
      paid[m.id] = 0
      shouldPay[m.id] = 0
    }

    for (const exp of tripExpenses.value) {
      if (paid[exp.paidById] !== undefined) {
        paid[exp.paidById] += exp.amount
      }
      const splitCount = exp.splitAmong.length || 1
      const share = exp.amount / splitCount
      for (const mid of exp.splitAmong) {
        if (shouldPay[mid] !== undefined) {
          shouldPay[mid] += share
        }
      }
    }

    return members.value.map((m) => ({
      memberId: m.id,
      memberName: m.name,
      memberColor: m.color,
      paid: paid[m.id] ?? 0,
      shouldPay: shouldPay[m.id] ?? 0,
      balance: (paid[m.id] ?? 0) - (shouldPay[m.id] ?? 0),
    }))
  })

  const settlements = computed((): Settlement[] => {
    const bs = balances.value.map((b) => ({ ...b }))
    const result: Settlement[] = []
    const creditors = bs.filter((b) => b.balance > 0.01).sort((a, b) => b.balance - a.balance)
    const debtors = bs.filter((b) => b.balance < -0.01).sort((a, b) => a.balance - b.balance)

    let ci = 0
    let di = 0
    while (ci < creditors.length && di < debtors.length) {
      const c = creditors[ci]
      const d = debtors[di]
      const amount = Math.min(c.balance, -d.balance)
      result.push({
        fromId: d.memberId,
        fromName: d.memberName,
        fromColor: d.memberColor,
        toId: c.memberId,
        toName: c.memberName,
        toColor: c.memberColor,
        amount: Math.round(amount * 100) / 100,
      })
      c.balance -= amount
      d.balance += amount
      if (Math.abs(c.balance) < 0.01) ci++
      if (Math.abs(d.balance) < 0.01) di++
    }
    return result
  })

  function getUserId() {
    return useAuthStore().currentUser?.id ?? 0
  }

  async function fetchTrips() {
    loading.value = true
    error.value = null
    try {
      const res = await tripApi.getAll(getUserId())
      trips.value = res.data
    } catch (e) {
      error.value = '載入旅程失敗'
      console.error(e)
    } finally {
      loading.value = false
    }
  }

  // 取得該月份所有旅程的支出（供預算頁使用）
  async function fetchMonthTripExpenses(month: string) {
    try {
      if (!trips.value.length) await fetchTrips()
      const results = await Promise.all(
        trips.value.map((t) =>
          tripExpenseApi.getByTripIdAndMonth(t.id, month).then((r) => r.data),
        ),
      )
      monthTripExpenses.value = results.flat()
    } catch (e) {
      console.error('載入旅行月支出失敗', e)
    }
  }

  async function fetchTripDetail(id: number) {
    loading.value = true
    error.value = null
    try {
      const [tripRes, membersRes, expensesRes] = await Promise.all([
        tripApi.getById(id),
        memberApi.getByTripId(id),
        tripExpenseApi.getByTripId(id),
      ])
      currentTrip.value = tripRes.data
      members.value = membersRes.data
      tripExpenses.value = expensesRes.data
    } catch (e) {
      error.value = '載入旅程詳情失敗'
      console.error(e)
    } finally {
      loading.value = false
    }
  }

  async function addTrip(data: Omit<Trip, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) {
    const res = await tripApi.create({ ...data, userId: getUserId() })
    trips.value.unshift(res.data)
    return res.data
  }

  async function editTrip(id: number, data: Partial<Trip>) {
    const res = await tripApi.update(id, data)
    const idx = trips.value.findIndex((t) => t.id === id)
    if (idx !== -1) trips.value[idx] = res.data
    if (currentTrip.value?.id === id) currentTrip.value = res.data
    return res.data
  }

  async function removeTrip(id: number) {
    await tripApi.delete(id)
    trips.value = trips.value.filter((t) => t.id !== id)
  }

  async function addMember(data: Omit<TripMember, 'id'>) {
    const res = await memberApi.create(data)
    members.value.push(res.data)
    return res.data
  }

  async function removeMember(id: number) {
    await memberApi.delete(id)
    members.value = members.value.filter((m) => m.id !== id)
  }

  async function addTripExpense(data: Omit<TripExpense, 'id' | 'createdAt'>) {
    const res = await tripExpenseApi.create(data)
    tripExpenses.value.unshift(res.data)
    return res.data
  }

  async function editTripExpense(id: number, data: Partial<TripExpense>) {
    const res = await tripExpenseApi.update(id, data)
    const idx = tripExpenses.value.findIndex((e) => e.id === id)
    if (idx !== -1) tripExpenses.value[idx] = res.data
    return res.data
  }

  async function removeTripExpense(id: number) {
    await tripExpenseApi.delete(id)
    tripExpenses.value = tripExpenses.value.filter((e) => e.id !== id)
  }

  return {
    trips,
    currentTrip,
    members,
    tripExpenses,
    monthTripExpenses,
    loading,
    error,
    totalTripExpense,
    balances,
    settlements,
    fetchTrips,
    fetchMonthTripExpenses,
    fetchTripDetail,
    addTrip,
    editTrip,
    removeTrip,
    addMember,
    removeMember,
    addTripExpense,
    editTripExpense,
    removeTripExpense,
  }
})
