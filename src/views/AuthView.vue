<template>
  <div class="auth-page">
    <!-- Background decoration -->
    <div class="auth-bg">
      <div class="bg-circle bg-circle-1" />
      <div class="bg-circle bg-circle-2" />
      <div class="bg-circle bg-circle-3" />
    </div>

    <div class="auth-card scale-in">
      <!-- Logo -->
      <div class="auth-logo">
        <span class="auth-logo-icon">✈️</span>
        <div>
          <h1 class="auth-title">旅途記帳</h1>
          <p class="auth-subtitle">Travel Ledger</p>
        </div>
      </div>

      <!-- Tabs（登入 / 註冊 模式才顯示） -->
      <div v-if="mode !== 'forgot'" class="auth-tabs" role="tablist">
        <button
          class="auth-tab"
          :class="{ active: mode === 'login' }"
          @click="switchMode('login')"
          role="tab"
        >登入</button>
        <button
          class="auth-tab"
          :class="{ active: mode === 'register' }"
          @click="switchMode('register')"
          role="tab"
        >註冊</button>
      </div>

      <!-- 找回密碼 Header -->
      <div v-if="mode === 'forgot'" class="forgot-header">
        <button type="button" class="back-btn" @click="backToLogin">
          <ArrowLeft :size="15" /> 返回登入
        </button>
        <div class="forgot-title-row">
          <KeyRound :size="18" class="forgot-icon" />
          <span class="forgot-title-text">找回密碼</span>
        </div>
        <!-- 步驟指示器 -->
        <div class="step-indicator">
          <span v-for="n in 3" :key="n" class="step-dot" :class="{ active: forgotStep >= n, done: forgotStep > n }">
            <Check v-if="forgotStep > n" :size="10" />
            <span v-else>{{ n }}</span>
          </span>
          <span class="step-line" :style="{ '--prog': `${((forgotStep - 1) / 2) * 100}%` }" />
        </div>
      </div>

      <!-- ── 表單切換 ── -->
      <Transition name="form-slide" mode="out-in">

        <!-- ① 登入 -->
        <form v-if="mode === 'login'" key="login" class="auth-form" @submit.prevent="handleLogin" novalidate>
          <div class="form-group">
            <label class="form-label" for="login-user">使用者名稱</label>
            <div class="input-wrap">
              <User2 class="input-icon" :size="16" />
              <input
                id="login-user"
                v-model="loginForm.username"
                class="form-input has-icon"
                placeholder="請輸入使用者名稱"
                autocomplete="username"
                tabindex="1"
                required
                @keydown.enter.prevent="focusNext('login-pw')"
              />
            </div>
          </div>

          <div class="form-group">
            <div class="label-row">
              <label class="form-label" for="login-pw">密碼</label>
              <button type="button" class="link-btn forgot-link" @click="switchMode('forgot')">忘記密碼？</button>
            </div>
            <div class="input-wrap">
              <Lock class="input-icon" :size="16" />
              <input
                id="login-pw"
                v-model="loginForm.password"
                :type="showPw ? 'text' : 'password'"
                class="form-input has-icon has-suffix"
                placeholder="請輸入密碼"
                autocomplete="current-password"
                tabindex="2"
                required
              />
              <button type="button" class="pw-toggle" @click="showPw = !showPw" :aria-label="showPw ? '隱藏密碼' : '顯示密碼'" tabindex="-1">
                <Eye v-if="!showPw" :size="15" />
                <EyeOff v-else :size="15" />
              </button>
            </div>
          </div>

          <p v-if="error" class="auth-error"><AlertCircle :size="14" /> {{ error }}</p>

          <button type="submit" class="btn btn-primary auth-btn" :disabled="loading" tabindex="3">
            <span v-if="loading" class="loading-dots">登入中</span>
            <span v-else>登入</span>
          </button>

          <p class="auth-switch">
            還沒有帳號？
            <button type="button" class="link-btn" @click="switchMode('register')" tabindex="4">立即註冊</button>
          </p>
        </form>

        <!-- ② 註冊 -->
        <form v-else-if="mode === 'register'" key="register" class="auth-form" @submit.prevent="handleRegister" novalidate>
          <div class="form-group">
            <label class="form-label" for="reg-display">顯示名稱</label>
            <div class="input-wrap">
              <Smile class="input-icon" :size="16" />
              <input id="reg-display" v-model="registerForm.displayName" class="form-input has-icon" placeholder="要如何稱呼你？" autocomplete="name" tabindex="1" @keydown.enter.prevent="focusNext('reg-user')" />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="reg-user">使用者名稱 *</label>
            <div class="input-wrap">
              <User2 class="input-icon" :size="16" />
              <input id="reg-user" v-model="registerForm.username" class="form-input has-icon" placeholder="設定登入帳號" autocomplete="username" tabindex="2" required @keydown.enter.prevent="focusNext('reg-pw')" />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="reg-pw">密碼 *</label>
            <div class="input-wrap">
              <Lock class="input-icon" :size="16" />
              <input id="reg-pw" v-model="registerForm.password" :type="showPw ? 'text' : 'password'" class="form-input has-icon has-suffix" placeholder="至少 6 個字元" autocomplete="new-password" tabindex="3" required minlength="6" @keydown.enter.prevent="focusNext('reg-pw2')" />
              <button type="button" class="pw-toggle" @click="showPw = !showPw" :aria-label="showPw ? '隱藏密碼' : '顯示密碼'" tabindex="-1">
                <Eye v-if="!showPw" :size="15" /><EyeOff v-else :size="15" />
              </button>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="reg-pw2">確認密碼 *</label>
            <div class="input-wrap">
              <Lock class="input-icon" :size="16" />
              <input id="reg-pw2" v-model="registerForm.confirmPassword" :type="showPw ? 'text' : 'password'" class="form-input has-icon" placeholder="再次輸入密碼" autocomplete="new-password" tabindex="4" required />
            </div>
            <p v-if="pwMismatch" class="field-error">密碼不一致</p>
          </div>

          <!-- 安全問題區塊 -->
          <div class="security-block">
            <div class="security-label">
              <ShieldCheck :size="14" class="security-icon" />
              <span>安全問題（用於找回密碼）</span>
            </div>

            <div class="form-group" style="margin-top: 10px;">
              <label class="form-label" for="reg-sq">安全問題 *</label>
              <select id="reg-sq" v-model="registerForm.securityQuestion" class="form-select" tabindex="5" required>
                <option v-for="q in SECURITY_QUESTIONS" :key="q" :value="q">{{ q }}</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label" for="reg-sa">問題答案 *</label>
              <div class="input-wrap">
                <Shield class="input-icon" :size="16" />
                <input id="reg-sa" v-model="registerForm.securityAnswer" class="form-input has-icon" placeholder="請填寫答案（不分大小寫）" tabindex="6" required autocomplete="off" />
              </div>
            </div>
          </div>

          <p v-if="error" class="auth-error"><AlertCircle :size="14" /> {{ error }}</p>

          <button type="submit" class="btn btn-primary auth-btn" :disabled="loading || pwMismatch || !registerForm.securityAnswer" tabindex="7">
            <span v-if="loading" class="loading-dots">建立中</span>
            <span v-else>建立帳號</span>
          </button>

          <p class="auth-switch">
            已有帳號？
            <button type="button" class="link-btn" @click="switchMode('login')" tabindex="8">去登入</button>
          </p>
        </form>

        <!-- ③-1 找回密碼：輸入帳號 -->
        <form v-else-if="forgotStep === 1" key="forgot-1" class="auth-form" @submit.prevent="handleForgotStep1" novalidate>
          <p class="forgot-desc">輸入你的帳號，我們將顯示你設定的安全問題。</p>

          <div class="form-group">
            <label class="form-label" for="forgot-user">使用者名稱</label>
            <div class="input-wrap">
              <User2 class="input-icon" :size="16" />
              <input id="forgot-user" v-model="forgotForm.username" class="form-input has-icon" placeholder="請輸入使用者名稱" tabindex="1" required autofocus />
            </div>
          </div>

          <p v-if="error" class="auth-error"><AlertCircle :size="14" /> {{ error }}</p>

          <button type="submit" class="btn btn-primary auth-btn" :disabled="loading || !forgotForm.username" tabindex="2">
            <span v-if="loading" class="loading-dots">查詢中</span>
            <span v-else>下一步</span>
          </button>
        </form>

        <!-- ③-2 找回密碼：回答安全問題 -->
        <form v-else-if="forgotStep === 2" key="forgot-2" class="auth-form" @submit.prevent="handleForgotStep2" novalidate>
          <div class="question-box">
            <HelpCircle :size="16" class="q-icon" />
            <span>{{ forgotQuestion }}</span>
          </div>

          <div class="form-group">
            <label class="form-label" for="forgot-answer">你的答案</label>
            <div class="input-wrap">
              <Shield class="input-icon" :size="16" />
              <input id="forgot-answer" v-model="forgotForm.answer" class="form-input has-icon" placeholder="請輸入答案（不分大小寫）" tabindex="1" required autofocus autocomplete="off" />
            </div>
          </div>

          <p v-if="error" class="auth-error"><AlertCircle :size="14" /> {{ error }}</p>

          <button type="submit" class="btn btn-primary auth-btn" :disabled="!forgotForm.answer" tabindex="2">
            驗證答案
          </button>
        </form>

        <!-- ③-3 找回密碼：設定新密碼 -->
        <form v-else-if="forgotStep === 3" key="forgot-3" class="auth-form" @submit.prevent="handleForgotStep3" novalidate>
          <p class="forgot-desc">答案正確！請設定你的新密碼。</p>

          <div class="form-group">
            <label class="form-label" for="new-pw">新密碼 *</label>
            <div class="input-wrap">
              <Lock class="input-icon" :size="16" />
              <input id="new-pw" v-model="forgotForm.newPassword" :type="showNewPw ? 'text' : 'password'" class="form-input has-icon has-suffix" placeholder="至少 6 個字元" tabindex="1" required minlength="6" autofocus autocomplete="new-password" />
              <button type="button" class="pw-toggle" @click="showNewPw = !showNewPw" tabindex="-1">
                <Eye v-if="!showNewPw" :size="15" /><EyeOff v-else :size="15" />
              </button>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="new-pw2">確認新密碼 *</label>
            <div class="input-wrap">
              <Lock class="input-icon" :size="16" />
              <input id="new-pw2" v-model="forgotForm.confirmNewPassword" :type="showNewPw ? 'text' : 'password'" class="form-input has-icon" placeholder="再次輸入新密碼" tabindex="2" required autocomplete="new-password" />
            </div>
            <p v-if="newPwMismatch" class="field-error">密碼不一致</p>
          </div>

          <p v-if="error" class="auth-error"><AlertCircle :size="14" /> {{ error }}</p>

          <button type="submit" class="btn btn-primary auth-btn" :disabled="loading || newPwMismatch || !forgotForm.newPassword" tabindex="3">
            <span v-if="loading" class="loading-dots">重設中</span>
            <span v-else>重設密碼</span>
          </button>
        </form>

        <!-- ③-4 找回密碼：成功畫面 -->
        <div v-else-if="forgotStep === 4" key="forgot-done" class="forgot-done">
          <div class="done-icon">✅</div>
          <p class="done-title">密碼已重設！</p>
          <p class="done-sub">請用新密碼重新登入。</p>
          <button type="button" class="btn btn-primary auth-btn" @click="backToLogin">返回登入</button>
        </div>

      </Transition>
    </div>

    <p class="auth-caption">記錄每一段旅途的美好 🌸</p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  User2, Lock, Eye, EyeOff, AlertCircle, Smile,
  ArrowLeft, KeyRound, ShieldCheck, Shield, HelpCircle, Check,
} from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { SECURITY_QUESTIONS } from '@/types'

const router = useRouter()
const authStore = useAuthStore()

type Mode = 'login' | 'register' | 'forgot'
const mode = ref<Mode>('login')
const loading = ref(false)
const error = ref('')
const showPw = ref(false)
const showNewPw = ref(false)

// ── 登入表單 ──────────────────────────────────────────────────
const loginForm = ref({ username: '', password: '' })

// ── 註冊表單 ──────────────────────────────────────────────────
const registerForm = ref({
  displayName: '',
  username: '',
  password: '',
  confirmPassword: '',
  securityQuestion: SECURITY_QUESTIONS[0],
  securityAnswer: '',
})

const pwMismatch = computed(
  () => !!registerForm.value.confirmPassword && registerForm.value.password !== registerForm.value.confirmPassword
)

// ── 找回密碼 ──────────────────────────────────────────────────
const forgotStep = ref<1 | 2 | 3 | 4>(1)
const forgotQuestion = ref('')
const forgotForm = ref({ username: '', answer: '', newPassword: '', confirmNewPassword: '' })

const newPwMismatch = computed(
  () => !!forgotForm.value.confirmNewPassword && forgotForm.value.newPassword !== forgotForm.value.confirmNewPassword
)

// ── 通用 ──────────────────────────────────────────────────────
function switchMode(m: Mode) {
  mode.value = m
  error.value = ''
  showPw.value = false
  if (m === 'forgot') {
    forgotStep.value = 1
    forgotForm.value = { username: '', answer: '', newPassword: '', confirmNewPassword: '' }
    forgotQuestion.value = ''
  }
}

function backToLogin() {
  switchMode('login')
}

function focusNext(id: string) {
  document.getElementById(id)?.focus()
}

// ── 登入 ──────────────────────────────────────────────────────
async function handleLogin() {
  if (!loginForm.value.username || !loginForm.value.password) {
    error.value = '請填寫帳號和密碼'
    return
  }
  loading.value = true
  error.value = ''
  try {
    await authStore.login(loginForm.value.username, loginForm.value.password)
    router.push('/')
  } catch (e) {
    error.value = e instanceof Error ? e.message : '登入失敗'
  } finally {
    loading.value = false
  }
}

// ── 註冊 ──────────────────────────────────────────────────────
async function handleRegister() {
  if (!registerForm.value.username || !registerForm.value.password) {
    error.value = '請填寫使用者名稱和密碼'
    return
  }
  if (registerForm.value.password.length < 6) {
    error.value = '密碼至少需要 6 個字元'
    return
  }
  if (pwMismatch.value) return
  if (!registerForm.value.securityAnswer.trim()) {
    error.value = '請填寫安全問題的答案'
    return
  }
  loading.value = true
  error.value = ''
  try {
    const { securitySaved } = await authStore.register(
      registerForm.value.username,
      registerForm.value.password,
      registerForm.value.displayName,
      registerForm.value.securityQuestion,
      registerForm.value.securityAnswer,
    )
    if (!securitySaved) {
      // 資料庫缺少安全問題欄位，帳號已建立但找回密碼功能不可用
      alert('帳號建立成功！\n\n⚠️ 注意：資料庫尚未更新，「找回密碼」功能目前不可用。\n請在 Supabase SQL Editor 執行 supabase-schema.sql 底部的 ALTER TABLE 語法。')
    }
    router.push('/')
  } catch (e) {
    error.value = e instanceof Error ? e.message : '註冊失敗'
  } finally {
    loading.value = false
  }
}

// ── 找回密碼 Step 1：查詢帳號 ──────────────────────────────────
async function handleForgotStep1() {
  if (!forgotForm.value.username) return
  loading.value = true
  error.value = ''
  try {
    forgotQuestion.value = await authStore.getSecurityQuestion(forgotForm.value.username)
    forgotStep.value = 2
  } catch (e) {
    error.value = e instanceof Error ? e.message : '查詢失敗，請稍後再試'
  } finally {
    loading.value = false
  }
}

// ── 找回密碼 Step 2：驗證安全問題答案 ──────────────────────────
function handleForgotStep2() {
  if (!forgotForm.value.answer) return
  error.value = ''
  const ok = authStore.verifySecurityAnswer(forgotForm.value.answer)
  if (!ok) {
    error.value = '答案不正確，請再試一次'
    return
  }
  forgotStep.value = 3
}

// ── 找回密碼 Step 3：更新密碼 ──────────────────────────────────
async function handleForgotStep3() {
  if (!forgotForm.value.newPassword || forgotForm.value.newPassword.length < 6) {
    error.value = '新密碼至少需要 6 個字元'
    return
  }
  if (newPwMismatch.value) return
  loading.value = true
  error.value = ''
  try {
    await authStore.resetPassword(forgotForm.value.newPassword)
    forgotStep.value = 4
  } catch (e) {
    error.value = e instanceof Error ? e.message : '重設失敗，請重新開始'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-page {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
  background: linear-gradient(135deg, var(--mint-pale) 0%, var(--cream) 50%, #FDF0F8 100%);
  position: relative;
  overflow: hidden;
}

/* Background decoration circles */
.auth-bg { position: absolute; inset: 0; pointer-events: none; }

.bg-circle {
  position: absolute;
  border-radius: 50%;
  opacity: 0.35;
}

.bg-circle-1 {
  width: 320px; height: 320px;
  background: radial-gradient(circle, var(--mint-light), transparent 70%);
  top: -80px; right: -80px;
}

.bg-circle-2 {
  width: 240px; height: 240px;
  background: radial-gradient(circle, var(--coral-light), transparent 70%);
  bottom: 40px; left: -60px;
}

.bg-circle-3 {
  width: 180px; height: 180px;
  background: radial-gradient(circle, var(--sand), transparent 70%);
  bottom: 120px; right: 60px;
}

/* Card */
.auth-card {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.9);
  border-radius: var(--radius-xl);
  padding: 36px 32px;
  width: 100%;
  max-width: 420px;
  box-shadow: 0 8px 40px rgba(92,200,190,0.15), 0 2px 8px rgba(0,0,0,0.06);
  position: relative;
  z-index: 1;
}

@media (max-width: 400px) {
  .auth-card { padding: 24px 18px; border-radius: var(--radius-lg); }
  .auth-logo-icon { font-size: 2rem; }
}

/* Logo */
.auth-logo {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 28px;
}

.auth-logo-icon { font-size: 2.5rem; }

.auth-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text);
  line-height: 1.2;
}

.auth-subtitle {
  font-size: 0.8rem;
  color: var(--text-muted);
  letter-spacing: 0.06em;
  margin-top: 2px;
}

/* Tabs */
.auth-tabs {
  display: flex;
  background: var(--bg);
  border-radius: var(--radius-lg);
  padding: 4px;
  margin-bottom: 24px;
}

.auth-tab {
  flex: 1;
  padding: 9px;
  border: none;
  background: none;
  border-radius: var(--radius);
  font-family: var(--font);
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-light);
  cursor: pointer;
  transition: all var(--transition);
}

.auth-tab.active {
  background: var(--card);
  color: var(--mint-dark);
  font-weight: 600;
  box-shadow: 0 1px 4px rgba(0,0,0,0.08);
}

/* ── 找回密碼 Header ──────────────────────────────────────── */
.forgot-header {
  margin-bottom: 24px;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: none;
  border: none;
  cursor: pointer;
  font-family: var(--font);
  font-size: 0.82rem;
  color: var(--text-muted);
  padding: 0;
  margin-bottom: 14px;
  transition: color var(--transition);
}
.back-btn:hover { color: var(--mint-dark); }

.forgot-title-row {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-bottom: 14px;
}

.forgot-icon { color: var(--mint-dark); }

.forgot-title-text {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text);
}

/* 步驟指示器 */
.step-indicator {
  display: flex;
  align-items: center;
  gap: 0;
  position: relative;
  padding: 0 2px;
}

.step-dot {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 600;
  background: var(--border-light);
  color: var(--text-muted);
  position: relative;
  z-index: 1;
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.step-dot.active {
  background: var(--mint);
  color: white;
}

.step-dot.done {
  background: var(--mint-dark);
  color: white;
}

.step-line {
  flex: 1;
  height: 2px;
  background: var(--border-light);
  position: relative;
  margin: 0 4px;
}

.step-line::after {
  content: '';
  position: absolute;
  left: 0; top: 0;
  height: 100%;
  width: var(--prog, 0%);
  background: var(--mint);
  transition: width 0.3s ease;
}

/* ── 表單通用 ─────────────────────────────────────────────── */
.auth-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.input-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 14px;
  color: var(--text-muted);
  pointer-events: none;
  flex-shrink: 0;
}

.form-input.has-icon  { padding-left: 40px; }
.form-input.has-suffix { padding-right: 40px; }

.pw-toggle {
  position: absolute;
  right: 12px;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  padding: 4px;
  transition: color var(--transition);
}
.pw-toggle:hover { color: var(--mint-dark); }

.label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}
.label-row .form-label { margin-bottom: 0; }

.forgot-link {
  font-size: 0.78rem;
  color: var(--text-muted);
  text-decoration: none;
  font-weight: 500;
}
.forgot-link:hover { color: var(--mint-dark); }

.field-error {
  font-size: 0.78rem;
  color: var(--coral);
  margin-top: 4px;
}

.auth-error {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 14px;
  background: #FEF2F2;
  border: 1px solid #FECACA;
  border-radius: var(--radius);
  color: #DC2626;
  font-size: 0.83rem;
}

.auth-btn {
  width: 100%;
  justify-content: center;
  padding: 12px;
  font-size: 0.95rem;
  margin-top: 4px;
}

.auth-switch {
  text-align: center;
  font-size: 0.83rem;
  color: var(--text-light);
}

.link-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-family: var(--font);
  font-size: inherit;
  color: var(--mint-dark);
  font-weight: 600;
  text-decoration: underline;
  text-underline-offset: 2px;
  padding: 0;
}
.link-btn:hover { color: var(--mint); }

/* ── 安全問題區塊（註冊） ─────────────────────────────────── */
.security-block {
  background: var(--mint-pale);
  border: 1.5px solid var(--mint-light);
  border-radius: var(--radius-lg);
  padding: 14px 16px 16px;
  display: flex;
  flex-direction: column;
  gap: 0;
}

.security-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--mint-dark);
}

.security-icon { color: var(--mint-dark); flex-shrink: 0; }

/* ── 找回密碼頁面內容 ──────────────────────────────────────── */
.forgot-desc {
  font-size: 0.85rem;
  color: var(--text-light);
  line-height: 1.5;
  margin-bottom: 4px;
}

.question-box {
  display: flex;
  align-items: flex-start;
  gap: 9px;
  background: var(--mint-pale);
  border: 1.5px solid var(--mint-light);
  border-radius: var(--radius);
  padding: 12px 14px;
  font-size: 0.875rem;
  color: var(--text);
  font-weight: 500;
  line-height: 1.4;
}

.q-icon { color: var(--mint-dark); flex-shrink: 0; margin-top: 1px; }

/* ── 找回密碼成功畫面 ──────────────────────────────────────── */
.forgot-done {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 24px 0 8px;
  text-align: center;
}

.done-icon { font-size: 2.8rem; }

.done-title {
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--text);
}

.done-sub {
  font-size: 0.85rem;
  color: var(--text-light);
  margin-bottom: 8px;
}

/* Loading dots animation */
.loading-dots::after {
  content: '';
  animation: dots 1.2s infinite;
}

@keyframes dots {
  0%, 20%  { content: ''; }
  40%      { content: '.'; }
  60%      { content: '..'; }
  80%, 100%{ content: '...'; }
}

/* Caption */
.auth-caption {
  margin-top: 24px;
  font-size: 0.82rem;
  color: var(--text-muted);
  position: relative;
  z-index: 1;
  letter-spacing: 0.02em;
}

/* Form slide transition */
.form-slide-enter-active,
.form-slide-leave-active { transition: all 0.22s ease; }
.form-slide-enter-from   { opacity: 0; transform: translateX(12px); }
.form-slide-leave-to     { opacity: 0; transform: translateX(-12px); }
</style>
