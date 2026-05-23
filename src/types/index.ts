export type ExpenseCategory =
  | 'food'
  | 'transport'
  | 'accommodation'
  | 'entertainment'
  | 'shopping'
  | 'health'
  | 'other'

export type PaymentMethod =
  | 'cash'
  | 'credit_card'
  | 'debit_card'
  | 'mobile_pay'
  | 'transfer'
  | 'other'

export const PAYMENT_META: Record<PaymentMethod, { label: string; emoji: string; color: string }> = {
  cash:        { label: '現金',     emoji: '💵', color: '#81C784' },
  credit_card: { label: '信用卡',   emoji: '💳', color: '#64B5F6' },
  debit_card:  { label: '金融卡',   emoji: '🏧', color: '#90A4AE' },
  mobile_pay:  { label: '行動支付', emoji: '📱', color: '#CE93D8' },
  transfer:    { label: '轉帳',     emoji: '🏦', color: '#FFB74D' },
  other:       { label: '其他',     emoji: '💰', color: '#A8B5C2' },
}

export const CATEGORY_META: Record<ExpenseCategory, { label: string; emoji: string; color: string }> = {
  food:          { label: '餐飲',  emoji: '🍜', color: '#FF8C69' },
  transport:     { label: '交通',  emoji: '🚆', color: '#64B5F6' },
  accommodation: { label: '住宿',  emoji: '🏨', color: '#81C784' },
  entertainment: { label: '娛樂',  emoji: '🎯', color: '#CE93D8' },
  shopping:      { label: '購物',  emoji: '🛍️', color: '#FFB74D' },
  health:        { label: '醫療',  emoji: '💊', color: '#F06292' },
  other:         { label: '其他',  emoji: '📌', color: '#90A4AE' },
}

export const CURRENCIES = [
  { code: 'TWD', symbol: 'NT$', label: '新台幣' },
  { code: 'JPY', symbol: '¥',   label: '日圓'   },
  { code: 'USD', symbol: '$',   label: '美金'   },
  { code: 'EUR', symbol: '€',   label: '歐元'   },
  { code: 'KRW', symbol: '₩',   label: '韓圜'   },
]

export interface User {
  id: number
  username: string
  displayName: string
  password: string
  createdAt: string
}

export type SafeUser = Omit<User, 'password'>

export interface Expense {
  id: number
  userId: number
  title: string
  amount: number
  category: ExpenseCategory
  paymentMethod: PaymentMethod
  date: string     // YYYY-MM-DD
  time: string     // HH:mm
  note: string
  createdAt: string
  updatedAt: string
}

export interface Trip {
  id: number
  userId: number
  name: string
  description: string
  startDate: string
  endDate: string
  currency: string
  createdAt: string
  updatedAt: string
}

export interface TripMember {
  id: number
  tripId: number
  name: string
  color: string
}

export interface TripExpense {
  id: number
  tripId: number
  title: string
  amount: number
  category: ExpenseCategory
  paymentMethod: PaymentMethod
  date: string
  time: string
  paidById: number
  splitAmong: number[]
  note: string
  createdAt: string
}

export interface Balance {
  memberId: number
  memberName: string
  memberColor: string
  paid: number
  shouldPay: number
  balance: number
}

export interface Settlement {
  fromId: number
  fromName: string
  fromColor: string
  toId: number
  toName: string
  toColor: string
  amount: number
}

export interface Budget {
  id: number
  userId: number
  month: string         // YYYY-MM
  total: number         // 0 = not set
  dailyBudget: number   // 記帳（日常）分配預算，0 = 未分配
  tripBudget: number    // 旅行分配預算，0 = 未分配
  categories: Partial<Record<ExpenseCategory, number>>
  createdAt: string
  updatedAt: string
}
