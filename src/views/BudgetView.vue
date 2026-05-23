<template>
  <div class="page-content fade-in">
    <!-- Header -->
    <div class="page-header">
      <div>
        <h1>預算管理</h1>
        <p class="sub">設定每月花費上限，掌握消費節奏</p>
      </div>
    </div>

    <!-- Month selector -->
    <div class="month-bar card">
      <button class="month-btn" @click="prevMonth">‹</button>
      <span class="month-label">{{ displayMonth }}</span>
      <button class="month-btn" @click="nextMonth">›</button>
    </div>

    <!-- Overview cards -->
    <div class="stats-row" v-if="currentBudget || totalSpent > 0">
      <div class="stat-card" :class="totalStatusClass">
        <div class="stat-label">本月實際支出</div>
        <div class="stat-value amount">NT$ {{ totalSpent.toLocaleString() }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">月預算上限</div>
        <div class="stat-value amount" :class="currentBudget?.total ? '' : 'muted'">
          {{ currentBudget?.total ? `NT$ ${currentBudget.total.toLocaleString()}` : '未設定' }}
        </div>
      </div>
      <div class="stat-card" v-if="currentBudget?.total">
        <div class="stat-label">剩餘額度</div>
        <div class="stat-value amount" :class="remaining >= 0 ? 'positive' : 'danger'">
          NT$ {{ Math.abs(remaining).toLocaleString() }}
          <span class="remain-suffix">{{ remaining >= 0 ? '可用' : '超支' }}</span>
        </div>
      </div>
    </div>

    <!-- Total budget progress -->
    <div v-if="currentBudget?.total" class="card section progress-section">
      <div class="progress-header">
        <span class="progress-title">總預算使用</span>
        <span class="progress-pct" :class="totalPctClass">{{ totalPct }}%</span>
      </div>
      <div class="progress-track">
        <div
          class="progress-fill"
          :class="totalPctClass"
          :style="{ width: `${Math.min(totalPct, 100)}%` }"
        />
      </div>
      <div class="progress-labels">
        <span>NT$ {{ totalSpent.toLocaleString() }}</span>
        <span class="muted">NT$ {{ currentBudget.total.toLocaleString() }}</span>
      </div>
    </div>

    <!-- Category progress -->
    <div v-if="hasCategoryBudgets" class="card section">
      <h3 class="section-heading">分類預算</h3>
      <div class="cat-budgets">
        <div
          v-for="(meta, key) in CATEGORY_META"
          :key="key"
          v-show="currentBudget?.categories?.[key as ExpenseCategory] || categorySpent[key as ExpenseCategory]"
          class="cat-budget-row"
        >
          <span class="cat-emoji">{{ meta.emoji }}</span>
          <div class="cat-budget-info">
            <div class="cat-budget-top">
              <span class="cat-name">{{ meta.label }}</span>
              <span
                class="cat-pct"
                :class="getCatPctClass(key as ExpenseCategory)"
                v-if="currentBudget?.categories?.[key as ExpenseCategory]"
              >
                {{ getCatPct(key as ExpenseCategory) }}%
              </span>
            </div>
            <div class="cat-progress-track">
              <div
                class="cat-progress-fill"
                :class="getCatPctClass(key as ExpenseCategory)"
                :style="{ width: getCatFillWidth(key as ExpenseCategory), background: meta.color }"
              />
            </div>
            <div class="cat-budget-amounts">
              <span class="amount">NT$ {{ (categorySpent[key as ExpenseCategory] ?? 0).toLocaleString() }}</span>
              <span class="muted" v-if="currentBudget?.categories?.[key as ExpenseCategory]">
                / NT$ {{ currentBudget.categories[key as ExpenseCategory]!.toLocaleString() }}
              </span>
              <span class="muted" v-else>未設預算</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit button -->
    <div class="set-btn-row">
      <button class="btn btn-primary" @click="openForm">
        <PencilLine :size="16" />
        {{ currentBudget ? '編輯預算' : '設定預算' }}
      </button>
      <button
        v-if="currentBudget"
        class="btn btn-danger"
        @click="handleDelete"
      >
        刪除本月預算
      </button>
    </div>

    <!-- Empty state -->
    <div v-if="!currentBudget && totalSpent === 0" class="empty-state">
      <span class="emoji">💰</span>
      <p>尚未設定 {{ displayMonth }} 的預算</p>
      <button class="btn btn-primary" @click="openForm">立即設定</button>
    </div>

    <!-- Budget form modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showForm" class="modal-overlay" @click.self="showForm = false">
          <div class="modal-box budget-form">
            <div class="modal-header">
              <h2>{{ currentBudget ? '編輯預算' : '設定預算' }}</h2>
              <button class="btn btn-icon btn-ghost" @click="showForm = false">✕</button>
            </div>

            <div class="modal-body">
              <p class="form-month-label">{{ displayMonth }}</p>

              <!-- Total budget -->
              <div class="form-group">
                <label class="form-label">月總預算（NT$）</label>
                <input
                  v-model.number="form.total"
                  type="number"
                  min="0"
                  placeholder="0 = 不設定總預算"
                  class="form-input"
                />
              </div>

              <div class="divider" style="margin: 16px 0;" />

              <p class="form-section-label">分類預算（選填，NT$）</p>

              <div class="cat-inputs">
                <div
                  v-for="(meta, key) in CATEGORY_META"
                  :key="key"
                  class="cat-input-row"
                >
                  <span class="cat-emoji-sm">{{ meta.emoji }}</span>
                  <span class="cat-name-sm">{{ meta.label }}</span>
                  <input
                    v-model.number="form.categories[key as ExpenseCategory]"
                    type="number"
                    min="0"
                    placeholder="不限"
                    class="form-input cat-num-input"
                  />
                </div>
              </div>
            </div>

            <div class="modal-footer">
              <button class="btn btn-ghost" @click="showForm = false">取消</button>
              <button class="btn btn-primary" :disabled="saving" @click="handleSave">
                {{ saving ? '儲存中…' : '儲存' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { PencilLine } from 'lucide-vue-next'
import { useBudgetStore } from '@/stores/budget'
import { useExpenseStore } from '@/stores/expense'
import { CATEGORY_META } from '@/types'
import type { ExpenseCategory } from '@/types'
import { useToast } from '@/composables/useToast'

const budgetStore = useBudgetStore()
const expenseStore = useExpenseStore()
const { show: showToast } = useToast()

// ─── Month state ───────────────────────────────────────────────
const now = new Date()
const year  = ref(now.getFullYear())
const month = ref(now.getMonth() + 1)

const monthKey = computed(() =>
  `${year.value}-${String(month.value).padStart(2, '0')}`
)

const displayMonth = computed(() =>
  `${year.value} 年 ${month.value} 月`
)

function prevMonth() {
  if (month.value === 1) { month.value = 12; year.value-- }
  else month.value--
}
function nextMonth() {
  if (month.value === 12) { month.value = 1; year.value++ }
  else month.value++
}

// ─── Data ──────────────────────────────────────────────────────
const currentBudget = computed(() =>
  budgetStore.budgets.find((b) => b.month === monthKey.value) ?? null
)

const monthExpenses = computed(() =>
  expenseStore.expenses.filter((e) => e.date.startsWith(monthKey.value))
)

const totalSpent = computed(() =>
  monthExpenses.value.reduce((s, e) => s + e.amount, 0)
)

const categorySpent = computed(() => {
  const map: Partial<Record<ExpenseCategory, number>> = {}
  for (const e of monthExpenses.value) {
    map[e.category] = (map[e.category] ?? 0) + e.amount
  }
  return map
})

const remaining = computed(() =>
  (currentBudget.value?.total ?? 0) - totalSpent.value
)

const totalPct = computed(() => {
  if (!currentBudget.value?.total) return 0
  return Math.round((totalSpent.value / currentBudget.value.total) * 100)
})

function pctClass(pct: number) {
  if (pct >= 100) return 'danger'
  if (pct >= 80)  return 'warning'
  return 'safe'
}

const totalPctClass  = computed(() => pctClass(totalPct.value))
const totalStatusClass = computed(() => {
  if (!currentBudget.value?.total) return ''
  return totalPct.value >= 100 ? 'stat-danger' : totalPct.value >= 80 ? 'stat-warning' : ''
})

const hasCategoryBudgets = computed(() => {
  const hasBudget = Object.keys(currentBudget.value?.categories ?? {}).length > 0
  const hasSpend  = Object.keys(categorySpent.value).length > 0
  return hasBudget || hasSpend
})

function getCatPct(cat: ExpenseCategory) {
  const budget = currentBudget.value?.categories?.[cat] ?? 0
  if (!budget) return 0
  return Math.round(((categorySpent.value[cat] ?? 0) / budget) * 100)
}

function getCatPctClass(cat: ExpenseCategory) {
  return pctClass(getCatPct(cat))
}

function getCatFillWidth(cat: ExpenseCategory) {
  const budget = currentBudget.value?.categories?.[cat] ?? 0
  if (!budget) return '0%'
  return `${Math.min(getCatPct(cat), 100)}%`
}

// ─── Form ──────────────────────────────────────────────────────
const showForm = ref(false)
const saving   = ref(false)

const form = ref({
  total: 0,
  categories: {} as Partial<Record<ExpenseCategory, number>>,
})

function openForm() {
  form.value = {
    total: currentBudget.value?.total ?? 0,
    categories: { ...(currentBudget.value?.categories ?? {}) },
  }
  showForm.value = true
}

async function handleSave() {
  saving.value = true
  try {
    // 過濾掉 0 或空的分類預算
    const cats: Partial<Record<ExpenseCategory, number>> = {}
    for (const [k, v] of Object.entries(form.value.categories)) {
      if (v && v > 0) cats[k as ExpenseCategory] = v
    }
    await budgetStore.saveBudget(monthKey.value, form.value.total, cats)
    showToast('預算已儲存 ✓')
    showForm.value = false
  } catch {
    showToast('儲存失敗，請重試')
  } finally {
    saving.value = false
  }
}

async function handleDelete() {
  if (!currentBudget.value) return
  if (!confirm(`確定要刪除 ${displayMonth.value} 的預算設定？`)) return
  await budgetStore.removeBudget(currentBudget.value.id)
  showToast('已刪除預算')
}

// ─── Load data when month changes ─────────────────────────────
async function loadMonth() {
  await Promise.all([
    expenseStore.fetchAll(year.value, month.value),
    budgetStore.fetchByMonth(monthKey.value),
  ])
}

watch(monthKey, loadMonth)

onMounted(async () => {
  await Promise.all([
    budgetStore.fetchAll(),
    expenseStore.fetchAll(year.value, month.value),
  ])
})
</script>

<style scoped>
.page-header { margin-bottom: 20px; }
.sub { color: var(--text-light); font-size: 0.875rem; margin-top: 4px; }

/* Month bar */
.month-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 20px;
  margin-bottom: 20px;
}

.month-btn {
  background: none;
  border: none;
  font-size: 1.4rem;
  color: var(--text-light);
  cursor: pointer;
  padding: 0 8px;
  line-height: 1;
  transition: color var(--transition);
}
.month-btn:hover { color: var(--mint-dark); }

.month-label {
  font-weight: 700;
  font-size: 1rem;
  color: var(--text);
}

/* Stats row */
.stats-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}
@media (max-width: 520px) {
  .stats-row { grid-template-columns: 1fr 1fr; }
  .stats-row .stat-card:last-child { grid-column: span 2; }
}

.stat-card { padding: 16px 18px; }
.stat-danger { border-color: #FECACA !important; background: #FFF5F5; }
.stat-warning { border-color: #FED7AA !important; background: #FFFBEB; }

.muted { color: var(--text-muted); }
.positive { color: var(--mint-dark); }
.danger { color: #DC2626; }
.warning { color: #D97706; }
.safe { color: var(--mint-dark); }

.remain-suffix {
  font-size: 0.75rem;
  font-family: var(--font);
  margin-left: 4px;
  font-weight: 500;
}

/* Progress section */
.section { margin-bottom: 20px; }
.progress-section { padding: 20px; }

.progress-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.progress-title { font-weight: 600; font-size: 0.9rem; }

.progress-pct {
  font-weight: 700;
  font-size: 0.9rem;
  font-family: var(--font-mono);
}
.progress-pct.safe    { color: var(--mint-dark); }
.progress-pct.warning { color: #D97706; }
.progress-pct.danger  { color: #DC2626; }

.progress-track {
  height: 10px;
  background: var(--border-light);
  border-radius: var(--radius-full);
  overflow: hidden;
  margin-bottom: 6px;
}

.progress-fill {
  height: 100%;
  border-radius: var(--radius-full);
  transition: width 0.5s ease;
}
.progress-fill.safe    { background: var(--mint); }
.progress-fill.warning { background: #F59E0B; }
.progress-fill.danger  { background: #EF4444; }

.progress-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.78rem;
  font-family: var(--font-mono);
  color: var(--text-light);
}

/* Category budgets */
.cat-budgets {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.cat-budget-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.cat-emoji { font-size: 1.1rem; margin-top: 2px; flex-shrink: 0; }

.cat-budget-info { flex: 1; }

.cat-budget-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.cat-name { font-size: 0.85rem; font-weight: 500; color: var(--text); }

.cat-pct {
  font-size: 0.78rem;
  font-weight: 700;
  font-family: var(--font-mono);
}
.cat-pct.safe    { color: var(--mint-dark); }
.cat-pct.warning { color: #D97706; }
.cat-pct.danger  { color: #DC2626; }

.cat-progress-track {
  height: 6px;
  background: var(--border-light);
  border-radius: var(--radius-full);
  overflow: hidden;
  margin-bottom: 4px;
}

.cat-progress-fill {
  height: 100%;
  border-radius: var(--radius-full);
  transition: width 0.5s ease;
  opacity: 0.85;
}
.cat-progress-fill.warning { filter: saturate(1.2); }
.cat-progress-fill.danger  { background: #EF4444 !important; }

.cat-budget-amounts {
  font-size: 0.78rem;
  font-family: var(--font-mono);
  color: var(--text);
}

/* Section heading */
.section.card { padding: 20px; }
.section-heading { font-size: 0.95rem; font-weight: 600; margin-bottom: 16px; }

/* Set button row */
.set-btn-row {
  display: flex;
  gap: 10px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

/* Form modal */
.budget-form {
  width: min(520px, 95vw);
  max-height: 90dvh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px 16px;
  border-bottom: 1px solid var(--border-light);
}

.modal-body {
  padding: 20px 24px;
  flex: 1;
  overflow-y: auto;
}

.modal-footer {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  padding: 16px 24px;
  border-top: 1px solid var(--border-light);
}

.form-month-label {
  font-weight: 700;
  font-size: 1rem;
  color: var(--mint-dark);
  margin-bottom: 16px;
}

.form-section-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-light);
  margin-bottom: 12px;
}

.cat-inputs {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.cat-input-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.cat-emoji-sm { font-size: 1rem; width: 24px; text-align: center; flex-shrink: 0; }
.cat-name-sm {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--text);
  width: 48px;
  flex-shrink: 0;
}

.cat-num-input {
  flex: 1;
  padding: 7px 12px;
  font-size: 0.875rem;
}

/* modal overlay */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  padding: 16px;
}

.modal-box {
  background: var(--card);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
}
</style>
