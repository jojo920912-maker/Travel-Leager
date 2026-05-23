import { supabase } from '@/lib/supabase'
import type { Expense, Trip, TripMember, TripExpense, User, Budget } from '@/types'

function now() {
  return new Date().toISOString()
}

/**
 * 將 Supabase 回傳的 { data, error } 轉換成 { data: T }，
 * 與原本 axios 回傳格式相容，讓 stores 無需修改。
 */
async function wrap<T>(
  query: PromiseLike<{ data: T | null; error: any }>
): Promise<{ data: T }> {
  const { data, error } = await query
  if (error) throw error
  return { data: data as T }
}

// ─── Auth ─────────────────────────────────────────────────────
export const authApi = {
  findByUsername(username: string) {
    return wrap<User[]>(
      supabase.from('users').select('*').eq('username', username)
    )
  },
  register(data: Omit<User, 'id' | 'createdAt'>) {
    return wrap<User>(
      supabase
        .from('users')
        .insert({ ...data, createdAt: now() })
        .select()
        .single()
    )
  },
}

// ─── Expenses ─────────────────────────────────────────────────
export const expenseApi = {
  getAll(userId: number, params?: Record<string, unknown>) {
    let q = supabase
      .from('expenses')
      .select('*')
      .eq('userId', userId)

    // date_like: '2024-01' → 前綴過濾當月資料
    if (params?.date_like) {
      q = q.like('date', `${params.date_like}%`)
    }

    return wrap<Expense[]>(
      q.order('date', { ascending: false }).order('time', { ascending: false })
    )
  },

  create(data: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>) {
    return wrap<Expense>(
      supabase
        .from('expenses')
        .insert({ ...data, createdAt: now(), updatedAt: now() })
        .select()
        .single()
    )
  },

  update(id: number, data: Partial<Omit<Expense, 'id' | 'createdAt'>>) {
    return wrap<Expense>(
      supabase
        .from('expenses')
        .update({ ...data, updatedAt: now() })
        .eq('id', id)
        .select()
        .single()
    )
  },

  async delete(id: number) {
    const { error } = await supabase.from('expenses').delete().eq('id', id)
    if (error) throw error
    return { data: null }
  },
}

// ─── Trips ────────────────────────────────────────────────────
export const tripApi = {
  getAll(userId: number) {
    return wrap<Trip[]>(
      supabase
        .from('trips')
        .select('*')
        .eq('userId', userId)
        .order('createdAt', { ascending: false })
    )
  },

  getById(id: number) {
    return wrap<Trip>(
      supabase.from('trips').select('*').eq('id', id).single()
    )
  },

  create(data: Omit<Trip, 'id' | 'createdAt' | 'updatedAt'>) {
    return wrap<Trip>(
      supabase
        .from('trips')
        .insert({ ...data, createdAt: now(), updatedAt: now() })
        .select()
        .single()
    )
  },

  update(id: number, data: Partial<Omit<Trip, 'id' | 'createdAt'>>) {
    return wrap<Trip>(
      supabase
        .from('trips')
        .update({ ...data, updatedAt: now() })
        .eq('id', id)
        .select()
        .single()
    )
  },

  async delete(id: number) {
    const { error } = await supabase.from('trips').delete().eq('id', id)
    if (error) throw error
    return { data: null }
  },
}

// ─── Members ──────────────────────────────────────────────────
export const memberApi = {
  getByTripId(tripId: number) {
    return wrap<TripMember[]>(
      supabase.from('members').select('*').eq('tripId', tripId)
    )
  },

  create(data: Omit<TripMember, 'id'>) {
    return wrap<TripMember>(
      supabase.from('members').insert(data).select().single()
    )
  },

  update(id: number, data: Partial<Omit<TripMember, 'id'>>) {
    return wrap<TripMember>(
      supabase.from('members').update(data).eq('id', id).select().single()
    )
  },

  async delete(id: number) {
    const { error } = await supabase.from('members').delete().eq('id', id)
    if (error) throw error
    return { data: null }
  },
}

// ─── Budgets ──────────────────────────────────────────────────
export const budgetApi = {
  getByMonth(userId: number, month: string) {
    return wrap<Budget[]>(
      supabase
        .from('budgets')
        .select('*')
        .eq('userId', userId)
        .eq('month', month)
    )
  },

  getAll(userId: number) {
    return wrap<Budget[]>(
      supabase
        .from('budgets')
        .select('*')
        .eq('userId', userId)
        .order('month', { ascending: false })
    )
  },

  create(data: Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>) {
    return wrap<Budget>(
      supabase
        .from('budgets')
        .insert({ ...data, createdAt: now(), updatedAt: now() })
        .select()
        .single()
    )
  },

  update(id: number, data: Partial<Omit<Budget, 'id' | 'createdAt'>>) {
    return wrap<Budget>(
      supabase
        .from('budgets')
        .update({ ...data, updatedAt: now() })
        .eq('id', id)
        .select()
        .single()
    )
  },

  async delete(id: number) {
    const { error } = await supabase.from('budgets').delete().eq('id', id)
    if (error) throw error
    return { data: null }
  },
}

// ─── Trip Expenses ────────────────────────────────────────────
export const tripExpenseApi = {
  getByTripId(tripId: number) {
    return wrap<TripExpense[]>(
      supabase
        .from('tripExpenses')
        .select('*')
        .eq('tripId', tripId)
        .order('date', { ascending: false })
        .order('time', { ascending: false })
    )
  },

  getByTripIdAndMonth(tripId: number, month: string) {
    return wrap<TripExpense[]>(
      supabase
        .from('tripExpenses')
        .select('*')
        .eq('tripId', tripId)
        .like('date', `${month}%`)
        .order('date', { ascending: false })
        .order('time', { ascending: false })
    )
  },

  create(data: Omit<TripExpense, 'id' | 'createdAt'>) {
    return wrap<TripExpense>(
      supabase
        .from('tripExpenses')
        .insert({ ...data, createdAt: now() })
        .select()
        .single()
    )
  },

  update(id: number, data: Partial<Omit<TripExpense, 'id' | 'createdAt'>>) {
    return wrap<TripExpense>(
      supabase
        .from('tripExpenses')
        .update(data)
        .eq('id', id)
        .select()
        .single()
    )
  },

  async delete(id: number) {
    const { error } = await supabase.from('tripExpenses').delete().eq('id', id)
    if (error) throw error
    return { data: null }
  },
}
