<template>
  <div class="page-content fade-in">
    <div class="page-header">
      <div>
        <h1>總覽</h1>
        <p class="sub">{{ todayStr }}</p>
      </div>
    </div>

    <!-- This month stats -->
    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-label">本月支出</div>
        <div class="stat-value amount">NT$ {{ monthTotal.toLocaleString() }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">本月筆數</div>
        <div class="stat-value">{{ monthExpenses.length }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">進行中旅程</div>
        <div class="stat-value">{{ activeTrips.length }}</div>
      </div>
    </div>

    <!-- Budget summary -->
    <RouterLink
      v-if="budgetStore.currentMonthBudget?.total"
      to="/budget"
      class="card budget-summary-card"
    >
      <div class="budget-summary-top">
        <span class="budget-summary-label">💰 本月預算</span>
        <span class="budget-summary-pct" :class="budgetPctClass">{{ budgetPct }}%</span>
      </div>
      <div class="budget-summary-track">
        <div
          class="budget-summary-fill"
          :class="budgetPctClass"
          :style="{ width: `${Math.min(budgetPct, 100)}%` }"
        />
      </div>
      <div class="budget-summary-labels">
        <span class="amount">NT$ {{ monthTotal.toLocaleString() }}</span>
        <span class="budget-summary-limit">/ NT$ {{ budgetStore.currentMonthBudget.total.toLocaleString() }}</span>
      </div>
    </RouterLink>

    <!-- Category breakdown -->
    <div v-if="Object.keys(expenseStore.byCategory).length" class="card section">
      <h3 class="section-heading">本月分類</h3>
      <div class="cat-bars">
        <div v-for="(meta, key) in CATEGORY_META" :key="key" v-show="expenseStore.byCategory[key]" class="cat-bar-row">
          <span class="cat-emoji">{{ meta.emoji }}</span>
          <span class="cat-label">{{ meta.label }}</span>
          <div class="bar-track">
            <div
              class="bar-fill"
              :style="{ width: barWidth(key), background: meta.color }"
            />
          </div>
          <span class="cat-amount amount">NT$ {{ (expenseStore.byCategory[key] ?? 0).toLocaleString() }}</span>
        </div>
      </div>
    </div>

    <!-- Recent expenses -->
    <div class="section">
      <div class="section-header">
        <h3>最近記帳</h3>
        <RouterLink to="/expenses" class="btn btn-ghost btn-sm">查看全部 →</RouterLink>
      </div>
      <div v-if="recentExpenses.length" class="expense-list">
        <ExpenseCard
          v-for="e in recentExpenses"
          :key="e.id"
          :expense="e"
          @edit="openEdit"
          @delete="deleteExpense"
        />
      </div>
      <div v-else class="empty-state">
        <span class="emoji">📝</span>
        <p>還沒有記帳，<RouterLink to="/expenses">去新增</RouterLink></p>
      </div>
    </div>

    <!-- Active trips -->
    <div v-if="activeTrips.length" class="section">
      <div class="section-header">
        <h3>進行中旅程</h3>
        <RouterLink to="/trips" class="btn btn-ghost btn-sm">查看全部 →</RouterLink>
      </div>
      <div class="trip-list-sm">
        <RouterLink
          v-for="t in activeTrips"
          :key="t.id"
          :to="`/trips/${t.id}`"
          class="trip-sm-card card"
        >
          <span class="trip-sm-icon">✈️</span>
          <div class="trip-sm-info">
            <span class="trip-sm-name">{{ t.name }}</span>
            <span class="trip-sm-date">{{ t.startDate }}</span>
          </div>
          <span class="trip-sm-cur">{{ t.currency }}</span>
        </RouterLink>
      </div>
    </div>

    <ExpenseForm v-model="showForm" :expense="editTarget" @saved="reload" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import ExpenseCard from '@/components/expense/ExpenseCard.vue'
import ExpenseForm from '@/components/expense/ExpenseForm.vue'
import { useExpenseStore } from '@/stores/expense'
import { useTripStore } from '@/stores/trip'
import { useBudgetStore } from '@/stores/budget'
import { CATEGORY_META } from '@/types'
import type { Expense } from '@/types'
import { useToast } from '@/composables/useToast'

const expenseStore = useExpenseStore()
const tripStore = useTripStore()
const budgetStore = useBudgetStore()
const { show: showToast } = useToast()
const showForm = ref(false)
const editTarget = ref<Expense | null>(null)

const now = new Date()
const todayStr = now.toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })

const monthExpenses = computed(() => {
  const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  return expenseStore.expenses.filter((e) => e.date.startsWith(ym))
})

const monthTotal = computed(() => monthExpenses.value.reduce((s, e) => s + e.amount, 0))
const recentExpenses = computed(() => expenseStore.expenses.slice(0, 5))

const budgetPct = computed(() => {
  const total = budgetStore.currentMonthBudget?.total ?? 0
  if (!total) return 0
  return Math.round((monthTotal.value / total) * 100)
})
const budgetPctClass = computed(() => {
  if (budgetPct.value >= 100) return 'danger'
  if (budgetPct.value >= 80)  return 'warning'
  return 'safe'
})
const activeTrips = computed(() => tripStore.trips.slice(0, 3))

function barWidth(category: string) {
  const max = Math.max(...Object.values(expenseStore.byCategory))
  if (!max) return '0%'
  const val = expenseStore.byCategory[category] ?? 0
  return `${(val / max) * 100}%`
}

function openEdit(expense: Expense) {
  editTarget.value = expense
  showForm.value = true
}

async function deleteExpense(id: number) {
  if (!confirm('確定要刪除這筆記帳？')) return
  await expenseStore.removeExpense(id)
  showToast('已刪除')
}

async function reload() {
  await expenseStore.fetchAll(now.getFullYear(), now.getMonth() + 1)
}

onMounted(async () => {
  await Promise.all([
    expenseStore.fetchAll(),
    tripStore.fetchTrips(),
    budgetStore.fetchByMonth(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`),
  ])
})
</script>

<style scoped>
.page-header { margin-bottom: 24px; }
.sub { color: var(--text-light); font-size: 0.875rem; margin-top: 4px; }

.stats-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 24px;
}

@media (max-width: 480px) {
  .stats-row { grid-template-columns: 1fr 1fr; }
  .stats-row .stat-card:last-child { grid-column: span 2; }
}

.section { margin-bottom: 28px; }

.section.card { padding: 20px; }

.section-heading {
  font-size: 0.95rem;
  font-weight: 600;
  margin-bottom: 16px;
  color: var(--text);
}

.cat-bars { display: flex; flex-direction: column; gap: 10px; }

.cat-bar-row {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.83rem;
}

.cat-emoji { font-size: 1rem; width: 20px; text-align: center; }
.cat-label { width: 36px; color: var(--text-light); }

.bar-track {
  flex: 1;
  height: 6px;
  background: var(--border-light);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  border-radius: var(--radius-full);
  transition: width 0.4s ease;
}

.cat-amount {
  width: 90px;
  text-align: right;
  font-size: 0.82rem;
  color: var(--text);
}

.expense-list { display: flex; flex-direction: column; gap: 8px; }

.trip-list-sm { display: flex; flex-direction: column; gap: 8px; }

.trip-sm-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  text-decoration: none;
  color: var(--text);
  transition: all var(--transition);
}
.trip-sm-card:hover { transform: translateX(4px); }

.trip-sm-icon { font-size: 1.5rem; }

.trip-sm-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.trip-sm-name { font-weight: 600; font-size: 0.9rem; }
.trip-sm-date { font-size: 0.75rem; color: var(--text-light); }
.trip-sm-cur {
  font-size: 0.75rem;
  font-weight: 600;
  background: var(--mint-pale);
  color: var(--mint-dark);
  padding: 2px 10px;
  border-radius: var(--radius-full);
}

/* Budget summary card */
.budget-summary-card {
  display: block;
  padding: 16px 20px;
  margin-bottom: 20px;
  text-decoration: none;
  color: var(--text);
}

.budget-summary-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-size: 0.88rem;
  font-weight: 600;
}

.budget-summary-label { color: var(--text); }

.budget-summary-pct {
  font-family: var(--font-mono);
  font-weight: 700;
}
.budget-summary-pct.safe    { color: var(--mint-dark); }
.budget-summary-pct.warning { color: #D97706; }
.budget-summary-pct.danger  { color: #DC2626; }

.budget-summary-track {
  height: 8px;
  background: var(--border-light);
  border-radius: var(--radius-full);
  overflow: hidden;
  margin-bottom: 8px;
}

.budget-summary-fill {
  height: 100%;
  border-radius: var(--radius-full);
  transition: width 0.5s ease;
}
.budget-summary-fill.safe    { background: var(--mint); }
.budget-summary-fill.warning { background: #F59E0B; }
.budget-summary-fill.danger  { background: #EF4444; }

.budget-summary-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  font-family: var(--font-mono);
}

.budget-summary-limit { color: var(--text-muted); }
</style>
