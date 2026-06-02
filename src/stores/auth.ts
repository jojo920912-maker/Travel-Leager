import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '@/services/api'
import type { SafeUser } from '@/types'

/** 將任意 error 轉成可讀的字串訊息 */
function toMessage(e: unknown, fallback: string): string {
  if (e instanceof Error) return e.message
  if (typeof e === 'object' && e !== null && 'message' in e) return String((e as any).message)
  return fallback
}

const STORAGE_KEY = 'travel_ledger_user'

export const useAuthStore = defineStore('auth', () => {
  const currentUser = ref<SafeUser | null>(null)
  const isAuthenticated = computed(() => !!currentUser.value)

  // ── 找回密碼流程的暫存狀態（不對外暴露）───────────────────────
  const _forgotUserId  = ref<number | null>(null)
  const _forgotAnswer  = ref<string>('')

  /** 從 localStorage 恢復登入狀態 */
  function restore() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) currentUser.value = JSON.parse(raw) as SafeUser
    } catch {
      localStorage.removeItem(STORAGE_KEY)
    }
  }

  /** 登入 */
  async function login(username: string, password: string) {
    try {
      const res = await authApi.findByUsername(username.trim())
      const match = res.data.find((u) => u.password === password)
      if (!match) throw new Error('帳號或密碼錯誤')
      const { password: _pw, securityAnswer: _sa, ...safe } = match
      currentUser.value = safe
      localStorage.setItem(STORAGE_KEY, JSON.stringify(safe))
    } catch (e) {
      throw new Error(toMessage(e, '登入失敗，請稍後再試'))
    }
  }

  /**
   * 註冊（含安全問題設定）
   * 回傳值：若資料庫尚未有安全問題欄位，securitySaved = false
   */
  async function register(
    username: string,
    password: string,
    displayName: string,
    securityQuestion: string,
    securityAnswer: string,
  ): Promise<{ securitySaved: boolean }> {
    try {
      const existing = await authApi.findByUsername(username.trim())
      if (existing.data.length) throw new Error('此使用者名稱已被使用')

      const res = await authApi.register({
        username: username.trim(),
        password,
        displayName: displayName.trim() || username.trim(),
        securityQuestion,
        securityAnswer: securityAnswer.trim().toLowerCase(),
      })
      const { password: _pw, securityAnswer: _sa, ...safe } = res.data
      currentUser.value = safe
      localStorage.setItem(STORAGE_KEY, JSON.stringify(safe))

      // 確認安全問題是否實際寫入（降級模式下欄位會是 undefined）
      const securitySaved = !!res.data.securityQuestion
      return { securitySaved }
    } catch (e) {
      throw new Error(toMessage(e, '註冊失敗，請稍後再試'))
    }
  }

  /**
   * 找回密碼 Step 1：輸入帳號，取得安全問題
   * 同時暫存 userId + 安全答案（不離開 store）
   */
  async function getSecurityQuestion(username: string): Promise<string> {
    const res = await authApi.findByUsername(username.trim())
    if (!res.data.length) throw new Error('找不到此使用者名稱')
    const user = res.data[0]
    if (!user.securityQuestion) throw new Error('此帳號尚未設定安全問題，無法使用找回密碼功能')

    _forgotUserId.value = user.id
    _forgotAnswer.value = (user.securityAnswer ?? '').trim().toLowerCase()
    return user.securityQuestion
  }

  /**
   * 找回密碼 Step 2：驗證答案（純前端比對，不發額外請求）
   * 答案大小寫不分、忽略首尾空白
   */
  function verifySecurityAnswer(answer: string): boolean {
    if (!_forgotAnswer.value) return false
    return answer.trim().toLowerCase() === _forgotAnswer.value
  }

  /**
   * 找回密碼 Step 3：更新密碼
   * 需先呼叫 getSecurityQuestion + verifySecurityAnswer 才能呼叫此函式
   */
  async function resetPassword(newPassword: string): Promise<void> {
    if (!_forgotUserId.value) throw new Error('請重新開始找回密碼流程')
    await authApi.updatePassword(_forgotUserId.value, newPassword)
    _forgotUserId.value = null
    _forgotAnswer.value = ''
  }

  /** 登出 */
  function logout() {
    currentUser.value = null
    localStorage.removeItem(STORAGE_KEY)
    _forgotUserId.value = null
    _forgotAnswer.value = ''
  }

  return {
    currentUser, isAuthenticated,
    restore, login, register, logout,
    getSecurityQuestion, verifySecurityAnswer, resetPassword,
  }
})
