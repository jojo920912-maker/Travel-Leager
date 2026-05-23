import axios from 'axios'
import type { Expense, Trip, TripMember, TripExpense, User, Budget } from '@/types'

const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL}`
    : '/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
})

function now() {
  return new Date().toISOString()
}

// ─── Auth ─────────────────────────────────────────────────────
export const authApi = {
  findByUsername(username: string) {
    return http.get<User[]>('/users', { params: { username } })
  },
  register(data: Omit<User, 'id'>) {
    return http.post<User>('/users', { ...data, createdAt: now() })
  },
}

// ─── Expenses ─────────────────────────────────────────────────
export const expenseApi = {
  getAll(userId: number, params?: Record<string, unknown>) {
    return http.get<Expense[]>('/expenses', {
      params: { _sort: 'date,time', _order: 'desc,desc', userId, ...params },
    })
  },
  create(data: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>) {
    return http.post<Expense>('/expenses', { ...data, createdAt: now(), updatedAt: now() })
  },
  update(id: number, data: Partial<Omit<Expense, 'id' | 'createdAt'>>) {
    return http.patch<Expense>(`/expenses/${id}`, { ...data, updatedAt: now() })
  },
  delete(id: number) {
    return http.delete(`/expenses/${id}`)
  },
}

// ─── Trips ────────────────────────────────────────────────────
export const tripApi = {
  getAll(userId: number) {
    return http.get<Trip[]>('/trips', { params: { userId, _sort: 'createdAt', _order: 'desc' } })
  },
  getById(id: number) {
    return http.get<Trip>(`/trips/${id}`)
  },
  create(data: Omit<Trip, 'id' | 'createdAt' | 'updatedAt'>) {
    return http.post<Trip>('/trips', { ...data, createdAt: now(), updatedAt: now() })
  },
  update(id: number, data: Partial<Omit<Trip, 'id' | 'createdAt'>>) {
    return http.patch<Trip>(`/trips/${id}`, { ...data, updatedAt: now() })
  },
  delete(id: number) {
    return http.delete(`/trips/${id}`)
  },
}

// ─── Members ──────────────────────────────────────────────────
export const memberApi = {
  getByTripId(tripId: number) {
    return http.get<TripMember[]>('/members', { params: { tripId } })
  },
  create(data: Omit<TripMember, 'id'>) {
    return http.post<TripMember>('/members', data)
  },
  update(id: number, data: Partial<Omit<TripMember, 'id'>>) {
    return http.patch<TripMember>(`/members/${id}`, data)
  },
  delete(id: number) {
    return http.delete(`/members/${id}`)
  },
}

// ─── Budgets ──────────────────────────────────────────────────
export const budgetApi = {
  getByMonth(userId: number, month: string) {
    return http.get<Budget[]>('/budgets', { params: { userId, month } })
  },
  getAll(userId: number) {
    return http.get<Budget[]>('/budgets', { params: { userId, _sort: 'month', _order: 'desc' } })
  },
  create(data: Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>) {
    return http.post<Budget>('/budgets', { ...data, createdAt: now(), updatedAt: now() })
  },
  update(id: number, data: Partial<Omit<Budget, 'id' | 'createdAt'>>) {
    return http.patch<Budget>(`/budgets/${id}`, { ...data, updatedAt: now() })
  },
  delete(id: number) {
    return http.delete(`/budgets/${id}`)
  },
}

// ─── Trip Expenses ────────────────────────────────────────────
export const tripExpenseApi = {
  getByTripId(tripId: number) {
    return http.get<TripExpense[]>('/tripExpenses', {
      params: { tripId, _sort: 'date,time', _order: 'desc,desc' },
    })
  },
  getByTripIdAndMonth(tripId: number, month: string) {
    return http.get<TripExpense[]>('/tripExpenses', {
      params: { tripId, date_like: month, _sort: 'date,time', _order: 'desc,desc' },
    })
  },
  create(data: Omit<TripExpense, 'id' | 'createdAt'>) {
    return http.post<TripExpense>('/tripExpenses', { ...data, createdAt: now() })
  },
  update(id: number, data: Partial<Omit<TripExpense, 'id' | 'createdAt'>>) {
    return http.patch<TripExpense>(`/tripExpenses/${id}`, data)
  },
  delete(id: number) {
    return http.delete(`/tripExpenses/${id}`)
  },
}
