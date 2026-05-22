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

      <!-- Tab switch -->
      <div class="auth-tabs" role="tablist">
        <button
          class="auth-tab"
          :class="{ active: mode === 'login' }"
          @click="switchMode('login')"
          role="tab"
          tabindex="0"
        >登入</button>
        <button
          class="auth-tab"
          :class="{ active: mode === 'register' }"
          @click="switchMode('register')"
          role="tab"
          tabindex="0"
        >註冊</button>
      </div>

      <!-- Login Form -->
      <Transition name="form-slide" mode="out-in">
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
            <label class="form-label" for="login-pw">密碼</label>
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
              <button
                type="button"
                class="pw-toggle"
                @click="showPw = !showPw"
                :aria-label="showPw ? '隱藏密碼' : '顯示密碼'"
                tabindex="-1"
              >
                <Eye v-if="!showPw" :size="15" />
                <EyeOff v-else :size="15" />
              </button>
            </div>
          </div>

          <p v-if="error" class="auth-error">
            <AlertCircle :size="14" /> {{ error }}
          </p>

          <button type="submit" class="btn btn-primary auth-btn" :disabled="loading" tabindex="3">
            <span v-if="loading" class="loading-dots">登入中</span>
            <span v-else>登入</span>
          </button>

          <p class="auth-switch">
            還沒有帳號？
            <button type="button" class="link-btn" @click="switchMode('register')" tabindex="4">立即註冊</button>
          </p>
        </form>

        <!-- Register Form -->
        <form v-else key="register" class="auth-form" @submit.prevent="handleRegister" novalidate>
          <div class="form-group">
            <label class="form-label" for="reg-display">顯示名稱</label>
            <div class="input-wrap">
              <Smile class="input-icon" :size="16" />
              <input
                id="reg-display"
                v-model="registerForm.displayName"
                class="form-input has-icon"
                placeholder="要如何稱呼你？"
                autocomplete="name"
                tabindex="1"
                @keydown.enter.prevent="focusNext('reg-user')"
              />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="reg-user">使用者名稱 *</label>
            <div class="input-wrap">
              <User2 class="input-icon" :size="16" />
              <input
                id="reg-user"
                v-model="registerForm.username"
                class="form-input has-icon"
                placeholder="設定登入帳號"
                autocomplete="username"
                tabindex="2"
                required
                @keydown.enter.prevent="focusNext('reg-pw')"
              />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="reg-pw">密碼 *</label>
            <div class="input-wrap">
              <Lock class="input-icon" :size="16" />
              <input
                id="reg-pw"
                v-model="registerForm.password"
                :type="showPw ? 'text' : 'password'"
                class="form-input has-icon has-suffix"
                placeholder="至少 6 個字元"
                autocomplete="new-password"
                tabindex="3"
                required
                minlength="6"
                @keydown.enter.prevent="focusNext('reg-pw2')"
              />
              <button
                type="button"
                class="pw-toggle"
                @click="showPw = !showPw"
                :aria-label="showPw ? '隱藏密碼' : '顯示密碼'"
                tabindex="-1"
              >
                <Eye v-if="!showPw" :size="15" />
                <EyeOff v-else :size="15" />
              </button>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="reg-pw2">確認密碼 *</label>
            <div class="input-wrap">
              <Lock class="input-icon" :size="16" />
              <input
                id="reg-pw2"
                v-model="registerForm.confirmPassword"
                :type="showPw ? 'text' : 'password'"
                class="form-input has-icon"
                placeholder="再次輸入密碼"
                autocomplete="new-password"
                tabindex="4"
                required
              />
            </div>
            <p v-if="pwMismatch" class="field-error">密碼不一致</p>
          </div>

          <p v-if="error" class="auth-error">
            <AlertCircle :size="14" /> {{ error }}
          </p>

          <button
            type="submit"
            class="btn btn-primary auth-btn"
            :disabled="loading || pwMismatch"
            tabindex="5"
          >
            <span v-if="loading" class="loading-dots">建立中</span>
            <span v-else>建立帳號</span>
          </button>

          <p class="auth-switch">
            已有帳號？
            <button type="button" class="link-btn" @click="switchMode('login')" tabindex="6">去登入</button>
          </p>
        </form>
      </Transition>
    </div>

    <!-- Deco caption -->
    <p class="auth-caption">記錄每一段旅途的美好 🌸</p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { User2, Lock, Eye, EyeOff, AlertCircle, Smile } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

type Mode = 'login' | 'register'
const mode = ref<Mode>('login')
const loading = ref(false)
const error = ref('')
const showPw = ref(false)

const loginForm = ref({ username: '', password: '' })
const registerForm = ref({ displayName: '', username: '', password: '', confirmPassword: '' })

const pwMismatch = computed(
  () => !!registerForm.value.confirmPassword && registerForm.value.password !== registerForm.value.confirmPassword
)

function switchMode(m: Mode) {
  mode.value = m
  error.value = ''
  showPw.value = false
}

function focusNext(id: string) {
  document.getElementById(id)?.focus()
}

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

  loading.value = true
  error.value = ''
  try {
    await authStore.register(
      registerForm.value.username,
      registerForm.value.password,
      registerForm.value.displayName,
    )
    router.push('/')
  } catch (e) {
    error.value = e instanceof Error ? e.message : '註冊失敗'
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

/* Form */
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

.form-input.has-icon { padding-left: 40px; }
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
