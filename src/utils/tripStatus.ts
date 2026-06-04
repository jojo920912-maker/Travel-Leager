/** 旅程狀態類型 */
export type TripStatus = 'active' | 'upcoming' | 'completed'

/**
 * 根據出發日 / 返回日判斷旅程狀態
 * - upcoming : 尚未出發（startDate > 今天）
 * - active   : 進行中（startDate <= 今天 <= endDate，或沒有 endDate）
 * - completed: 已結束（endDate < 今天）
 */
export function getTripStatus(startDate: string, endDate?: string | null): TripStatus {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const start = new Date(startDate + 'T00:00:00')
  const end   = endDate ? new Date(endDate + 'T00:00:00') : null

  if (start > today) return 'upcoming'
  if (end && end < today) return 'completed'
  return 'active'
}

/** 距離目標日期的天數（正數 = 未來） */
export function daysUntil(dateStr: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(dateStr + 'T00:00:00')
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

/** 距離目標日期的完整月數（至少 1） */
export function monthsUntil(dateStr: string): number {
  const today  = new Date()
  const target = new Date(dateStr + 'T00:00:00')
  const diff   = (target.getFullYear() - today.getFullYear()) * 12
                 + (target.getMonth() - today.getMonth())
  return Math.max(1, diff)
}

/**
 * 倒數文字：
 * - 今天出發       → "今日出發！"
 * - 距今 ≤ 2 個月  → "即將到來"（月份相近，不顯示具體數字）
 * - 距今 > 2 個月  → "還有 N 個月"
 */
export function getCountdownText(dateStr: string): string {
  const days   = daysUntil(dateStr)
  const months = monthsUntil(dateStr)
  if (days   <= 0) return '今日出發！'
  if (months <= 2) return '即將到來'
  return `還有 ${months} 個月`
}

/** 月份標籤，e.g. "6月" */
export function toMonthLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return `${d.getMonth() + 1} 月`
}

/** 今天的月份標籤，e.g. "6月" */
export function todayMonthLabel(): string {
  const d = new Date()
  return `${d.getMonth() + 1} 月`
}
