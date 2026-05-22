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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Plus, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-vue-next'
import ExpenseCard from '@/components/expense/ExpenseCard.vue'
import ExpenseForm from '@/components/expense/ExpenseForm.vue'
import { useExpenseStore } from '@/stores/expense'
import { CATEGORY_META } from '@/types'
import type { Expense, ExpenseCategory } from '@/types'
import { useToast } from '@/composables/useToast'
import { useKeyboard } from '@/composables/useKeyboard'

const store = useExpenseStore()
const { show: showToast } = useToast()

const now = new Date()
const year = ref(now.getFullYear())
const month = ref(now.getMonth() + 1)
const activeCategory = ref<ExpenseCategory | 'all'>('all')
const showForm = ref(false)
const editTarget = ref<Expense | null>(null)

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
  await store.removeExpense(id)
  showToast('已刪除')
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

onMounted(reload)
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
