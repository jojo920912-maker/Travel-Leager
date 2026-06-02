import { supabase } from '@/lib/supabase'
import type { Expense, Trip, TripMember, TripExpense, User, Budget } from '@/types'

function now() {
  return new Date().toISOString()
}

/**
 * 將 Supabase 回傳的 { data, error } 轉換成 { data: T }。
 * 將 PostgrestError 包裝成標準 Error，讓錯誤訊息能在 UI 正確顯示。
 */
async function wrap<T>(
  query: PromiseLike<{ data: T | null; error: any }>
): Promise<{ data: T }> {
  const { data, error } = await query
  if (error) throw new Error(error.message ?? JSON.stringify(error))
  return { data: data as T }
}

/** 判斷是否為「欄位不存在」類型的 PostgreSQL 錯誤 */
function isColumnMissingError(e: unknown): boolean {
  const msg = (e as Error)?.message ?? ''
  return msg.includes('column') && (
    msg.includes('does not exist') || msg.includes('of relation')
  )
}

// ─── Auth ─────────────────────────────────────────────────────
export const authApi = {
  findByUsername(username: string) {
    return wrap<User[]>(
      supabase.from('users').select('*').eq('username', username)
    )
  },

  /**
   * 先嘗試含安全問題欄位的 INSERT；
   * 若資料表尚未有 securityQuestion / securityAnswer 欄位，
   * 則降級為不含這兩欄的 INSERT，讓基本註冊仍能成功。
   */
  async register(data: Omit<User, 'id' | 'createdAt'>): Promise<{ data: User }> {
    // 嘗試完整 INSERT（含安全問題欄位）
    const fullPayload = { ...data, createdAt: now() }
    const full = await supabase.from('users').insert(fullPayload).select().single()
    if (!full.error) return { data: full.data as User }

    // 若是欄位不存在錯誤，降級為不含安全問題欄位的 INSERT
    if (isColumnMissingError(new Error(full.error.message))) {
      const { securityQuestion: _sq, securityAnswer: _sa, ...baseData } = data
      return wrap<User>(
        supabase
          .from('users')
          .insert({ ...baseData, createdAt: now() })
          .select()
          .single()
      )
    }

    // 其他錯誤直接拋出
    throw new Error(full.error.message ?? '註冊失敗')
  },

  updatePassword(id: number, newPassword: string) {
    return wrap<User>(
      supabase
        .from('users')
        .update({ password: newPassword })
        .eq('id', id)
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
