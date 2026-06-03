<template>
  <div class="page-content fade-in">
    <div class="page-header">
      <div>
        <h1>個人記帳</h1>
        <p class="sub">總計 NT$ {{ store.totalAmount.toLocaleString() }}</p>
      </div>
      <div class="header-actions">
        <button class="btn btn-primary" @click="openAdd" title="新增 (N)">
          <Plus :size="16" />
          <span class="btn-label">新增</span>
        </button>
      </div>
    </div>

    <!-- Month selector -->
    <div class="month-nav">
      <button class="btn btn-ghost btn-icon" @click="prevMonth" aria-label="上個月" tabindex="0">
        <ChevronLeft :size="18" />
      </button>
      <span class="month-label">{{ year }} 年 {{ month }} 月</span>
      <button class="btn btn-ghost btn-icon" @click="nextMonth" aria-label="下個月" tabindex="0">
        <ChevronRight :size="18" />
      </button>
    </div>

    <!-- Daily budget mini-bar -->
    <div v-if="budgetStore.currentMonthBudget || dailySpent > 0" class="budget-mini card">
      <div class="bm-left">
        <span class="bm-label">📒 本月記帳預算</span>
        <span class="bm-val amount">NT$ {{ dailySpent.toLocaleString() }}</span>
        <span class="bm-limit" v-if="dailyBudget">
          / NT$ {{ dailyBudget.toLocaleString() }}
          <span class="bm-pct" :class="dailyPctClass">（{{ dailyPct }}%）</span>
        </span>
        <span class="bm-limit muted" v-else>未分配預算</span>
      </div>
      <div class="bm-right">
        <div v-if="dailyBudget" class="bm-track">
          <div class="bm-fill" :class="dailyPctClass" :style="{ width: `${Math.min(dailyPct, 100)}%` }" />
        </div>
        <button class="btn btn-ghost btn-sm" @click="openBudgetModal">
          {{ dailyBudget ? '編輯' : '設定預算' }}
        </button>
      </div>
    </div>

    <!-- Category filter -->
    <div class="tag-group filter-tags" role="group" aria-label="分類篩選">
      <button
        class="tag"
        :class="{ active: activeCategory === 'all' }"
        @click="activeCategory = 'all'"
        tabindex="0"
      >全部</button>
      <button
        v-for="(meta, key) in CATEGORY_META"
        :key="key"
        class="tag"
        :class="{ active: activeCategory === key }"
        @click="activeCategory = (activeCategory === key ? 'all' : key as ExpenseCategory)"
        tabindex="0"
      >
        {{ meta.emoji }} {{ meta.label }}
      </button>
    </div>

    <!-- Loading -->
    <div v-if="store.loading" class="loading">載入中...</div>

    <!-- Error -->
    <div v-else-if="store.error" class="error-banner">
      <AlertCircle :size="16" />
      {{ store.error }}
    </div>

    <!-- Empty state -->
    <div v-else-if="!filteredExpenses.length" class="empty-state">
      <span class="emoji">💴</span>
      <p>這個月還沒有紀錄</p>
      <button class="btn btn-primary" @click="openAdd">新增第一筆</button>
    </div>

    <!-- Expense list grouped by date -->
    <div v-else class="date-groups">
      <div v-for="(group, date) in groupedExpenses" :key="date" class="date-group slide-up">
        <div class="date-header">
          <span class="date-label">{{ formatDateLabel(date as string) }}</span>
          <span class="date-total amount">NT$ {{ group.reduce((s, e) => s + e.amount, 0).toLocaleString() }}</span>
        </div>
        <div class="expense-list">
          <ExpenseCard
            v-for="e in group"
            :key="e.id"
            :expense="e"
            @edit="openEdit"
            @delete="confirmDelete"
          />
        </div>
      </div>
    </div>

    <ExpenseForm v-model="showForm" :expense="editTarget" @saved="reload" />

    <!-- Budget allocation modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showBudgetModal" class="modal-overlay" @click.self="showBudgetModal = false">
          <div class="modal-box alloc-modal">
            <div class="modal-header">
              <h2>設定記帳預算分配</h2>
              <button class="btn btn-icon btn-ghost" @click="showBudgetModal = false">✕</button>
            </div>
            <div class="modal-body">
              <p class="modal-sub">{{ year }} 年 {{ month }} 月</p>
              <div class="form-group">
                <label class="form-label">記帳（日常）分配金額（NT$）</label>
                <input v-model.number="allocInput" type="number" min="0" placeholder="0 = 不分配" class="form-input" />
              </div>
              <RouterLink to="/budget" class="goto-budget" @click="showBudgetModal = false">
                前往完整預算設定 →
              </RouterLink>
            </div>
            <div class="modal-footer">
              <button class="btn btn-ghost" @click="showBudgetModal = false">取消</button>
              <button class="btn btn-primary" :disabled="allocSaving" @click="saveAlloc">
                {{ allocSaving ? '儲存中…' : '儲存' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Plus, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-vue-next'
import ExpenseCard from '@/components/expense/ExpenseCard.vue'
import ExpenseForm from '@/components/expense/ExpenseForm.vue'
import { useExpenseStore } from '@/stores/expense'
import { useBudgetStore } from '@/stores/budget'
import { CATEGORY_META } from '@/types'
import type { Expense, ExpenseCategory } from '@/types'
import { useToast } from '@/composables/useToast'
import { useKeyboard } from '@/composables/useKeyboard'

const store = useExpenseStore()
const budgetStore = useBudgetStore()
const { show: showToast } = useToast()

const now = new Date()
const year = ref(now.getFullYear())
const month = ref(now.getMonth() + 1)
const activeCategory = ref<ExpenseCategory | 'all'>('all')
const showForm = ref(false)
const editTarget = ref<Expense | null>(null)

const monthKey = computed(() => `${year.value}-${String(month.value).padStart(2, '0')}`)
const dailyBudget = computed(() => budgetStore.currentMonthBudget?.dailyBudget ?? 0)
const dailySpent  = computed(() => store.expenses.reduce((s, e) => s + e.amount, 0))
const dailyPct    = computed(() => dailyBudget.value ? Math.round((dailySpent.value / dailyBudget.value) * 100) : 0)
const dailyPctClass = computed(() => {
  const p = dailyPct.value
  return p >= 100 ? 'danger' : p >= 80 ? 'warning' : 'safe'
})

// Budget allocation modal
const showBudgetModal = ref(false)
const allocInput = ref(0)
const allocSaving = ref(false)

function openBudgetModal() {
  allocInput.value = dailyBudget.value
  showBudgetModal.value = true
}

async function saveAlloc() {
  allocSaving.value = true
  try {
    await budgetStore.updateAllocation(monthKey.value, 'daily', allocInput.value)
    showToast('記帳預算已更新 ✓')
    showBudgetModal.value = false
  } catch (e) {
    const msg = e instanceof Error ? e.message : '儲存失敗'
    showToast(msg, 'error')
  } finally {
    allocSaving.value = false
  }
}

const filteredExpenses = computed(() =>
  store.filterByCategory(activeCategory.value)
)

const groupedExpenses = computed(() => {
  const map: Record<string, Expense[]> = {}
  for (const e of filteredExpenses.value) {
    if (!map[e.date]) map[e.date] = []
    map[e.date].push(e)
  }
  return map
})

function formatDateLabel(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('zh-TW', { month: 'long', day: 'numeric', weekday: 'short' })
}

function prevMonth() {
  if (month.value === 1) { year.value--; month.value = 12 }
  else month.value--
  reload()
}

function nextMonth() {
  if (month.value === 12) { year.value++; month.value = 1 }
  else month.value++
  reload()
}

function openAdd() {
  editTarget.value = null
  showForm.value = true
}

function openEdit(expense: Expense) {
  editTarget.value = expense
  showForm.value = true
}

async function confirmDelete(id: number) {
  if (!confirm('確定要刪除這筆記帳？')) return
  try {
    await store.removeExpense(id)
    showToast('已刪除')
  } catch (e) {
    const msg = e instanceof Error ? e.message : '刪除失敗，請重試'
    console.error('[ExpenseView delete]', e)
    showToast(msg, 'error')
  }
}

async function reload() {
  await store.fetchAll(year.value, month.value)
}

useKeyboard({
  n: openAdd,
  N: openAdd,
  ArrowLeft:  prevMonth,
  ArrowRight: nextMonth,
})

onMounted(async () => {
  await reload()
  await budgetStore.fetchByMonth(monthKey.value)
})
</script>

<style scoped>
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 20px;
}

.sub { color: var(--text-light); font-size: 0.875rem; margin-top: 4px; }

.header-actions { display: flex; gap: 8px; }

.month-nav {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.month-label {
  font-weight: 600;
  font-size: 1rem;
  min-width: 110px;
  text-align: center;
}

.filter-tags { margin-bottom: 20px; }

/* Budget mini bar */
.budget-mini {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  margin-bottom: 16px;
  gap: 12px;
  flex-wrap: wrap;
}
.bm-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  font-size: 0.83rem;
}
.bm-label { font-weight: 600; color: var(--text); }
.bm-val { font-weight: 700; color: var(--text); }
.bm-limit { color: var(--text-muted); }
.bm-pct { font-family: var(--font-mono); font-weight: 700; }
.bm-pct.safe    { color: var(--mint-dark); }
.bm-pct.warning { color: #D97706; }
.bm-pct.danger  { color: #DC2626; }
.bm-right { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
.bm-track {
  width: 80px; height: 6px;
  background: var(--border-light);
  border-radius: var(--radius-full);
  overflow: hidden;
}
.bm-fill { height: 100%; border-radius: var(--radius-full); transition: width 0.4s; }
.bm-fill.safe    { background: var(--mint); }
.bm-fill.warning { background: #F59E0B; }
.bm-fill.danger  { background: #EF4444; }

/* Alloc modal */
.alloc-modal { width: min(400px, 95vw); }
.modal-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 20px 24px 16px;
  border-bottom: 1px solid var(--border-light);
}
.modal-body { padding: 20px 24px; }
.modal-footer {
  display: flex; gap: 10px; justify-content: flex-end;
  padding: 16px 24px;
  border-top: 1px solid var(--border-light);
}
.modal-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.4);
  display: flex; align-items: center; justify-content: center;
  z-index: 200; padding: 16px;
}
.modal-box { background: var(--card); border-radius: var(--radius-xl); box-shadow: var(--shadow-lg); }
.modal-sub { font-size: 0.85rem; color: var(--text-muted); margin-bottom: 16px; }
.goto-budget {
  display: block;
  margin-top: 14px;
  font-size: 0.82rem;
  color: var(--mint-dark);
  text-decoration: none;
}
.goto-budget:hover { text-decoration: underline; }

.date-groups { display: flex; flex-direction: column; gap: 20px; }

.date-group {}

.date-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 4px;
  margin-bottom: 8px;
  border-bottom: 2px solid var(--mint-pale);
}

.date-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--mint-dark);
}

.date-total { font-size: 0.85rem; color: var(--text-light); }

.expense-list { display: flex; flex-direction: column; gap: 8px; }

.loading { color: var(--text-light); padding: 40px; text-align: center; }

.error-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 18px;
  background: #FEF2F2;
  border-radius: var(--radius);
  color: #DC2626;
  font-size: 0.875rem;
}

@media (max-width: 768px) {
  .btn-label { display: none; }
}
</style>
